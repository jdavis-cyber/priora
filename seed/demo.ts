// seed/demo.ts — demo profile: wipe-and-reload, ALL CONTENT FICTIONAL.
// Runs as the OWNER role (DATABASE_URL): seeding is provisioning, not app traffic
// (which is also why it may wipe the otherwise append-only audit_log — the
// INSERT-only guarantee binds the priora_app runtime role, not provisioning).
import { rm } from "node:fs/promises";
import path from "node:path";
import { hashSync } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import type { Db } from "../src/db";
import {
  aepExports,
  appMeta,
  controls,
  correctiveActions,
  evidenceArtifacts,
  evidenceLinks,
  gates,
  phases,
  projectAssignments,
  projects,
  riskAcceptances,
  riskControlLinks,
  risks,
  soaEntries,
  users,
} from "../src/db/schema";
import { storage } from "../src/lib/storage";
import { recordAudit } from "../src/modules/audit/record";
import { generateAep } from "../src/modules/evidence/generate-aep";
import { ingestEvidence } from "../src/modules/evidence/ingest";
import { seedControls } from "./seed-controls";
import {
  ALL_REFS,
  DEMO_ASSIGNMENT_ROLES,
  DEMO_PASSWORD,
  DEMO_PROJECTS,
  DEMO_SEED_VERSION,
  DEMO_USERS,
  LEDGER_RISK_ACCEPTANCE,
  SENTINEL_CORRECTIVE_ACTION,
  type SoaPlan,
} from "./demo-data";

const BCRYPT_ROUNDS = 12; // spec/contract: bcryptjs, 12 rounds

function assertPartition(projectName: string, plan: SoaPlan, libraryRefs: Set<string>): void {
  const planned = [
    ...plan.implemented,
    ...plan.partially_implemented,
    ...plan.inherited,
    ...plan.not_applicable.map((n) => n.ref),
    ...plan.not_implemented,
  ];
  const unique = new Set(planned);
  if (unique.size !== planned.length) {
    throw new Error(`${projectName}: SoA plan lists a control ref twice`);
  }
  if (unique.size !== libraryRefs.size || [...unique].some((r) => !libraryRefs.has(r))) {
    const missing = [...libraryRefs].filter((r) => !unique.has(r));
    const extra = [...unique].filter((r) => !libraryRefs.has(r));
    throw new Error(
      `${projectName}: SoA plan does not partition the control library (missing: ${missing.join(",") || "none"}; extra: ${extra.join(",") || "none"})`,
    );
  }
}

export async function seedDemo(db: Db): Promise<void> {
  // --- Guard + wipe, atomically -------------------------------------------
  await db.transaction(async (tx) => {
    const [meta] = await tx
      .select()
      .from(appMeta)
      .where(eq(appMeta.key, "seed_profile"))
      .for("update");
    if (meta && meta.value !== "demo" && meta.value !== "test") {
      throw new Error(
        `Refusing to wipe: app_meta seed_profile is '${meta.value}' (only demo/test/absent may be reloaded). If this is intentional, clear app_meta manually first.`,
      );
    }
    // FK-safe wipe order (children first)
    await tx.delete(evidenceLinks);
    await tx.delete(aepExports);
    await tx.delete(evidenceArtifacts);
    await tx.delete(riskControlLinks);
    await tx.delete(riskAcceptances);
    await tx.delete(risks);
    await tx.delete(correctiveActions);
    await tx.delete(gates);
    await tx.delete(phases);
    await tx.delete(soaEntries);
    await tx.delete(controls); // library re-seeded below — clears any test-fixture controls so the demo is exactly the 63
    await tx.delete(projectAssignments);
    await tx.delete(projects);
    // audit_log's append-only trigger (M1, 0002) blocks row-level DELETE even for
    // the owner. TRUNCATE is the provisioning escape hatch: it skips row-level
    // triggers and needs a privilege priora_app never holds, so NFR-01 still
    // binds all runtime traffic. Required here: audit rows FK-reference users.
    await tx.execute(sql`TRUNCATE TABLE audit_log`);
    await tx.delete(users);
  });

  // Storage reset mirrors the DB wipe (storage is non-transactional by nature).
  // Direct fs here is provisioning, same standing as the DB owner connection.
  const storageRoot = process.env.STORAGE_ROOT ?? path.join(process.cwd(), "var", "storage");
  await rm(path.join(storageRoot, "projects"), { recursive: true, force: true });

  // --- Control library (idempotent; M3 seeder) ----------------------------
  await seedControls(db);
  const controlRows = await db.select().from(controls);
  if (controlRows.length !== 63) {
    throw new Error(`Expected the 63-control library, found ${controlRows.length}`);
  }
  const libraryRefs = new Set(controlRows.map((c) => c.ref));
  for (const ref of ALL_REFS) {
    if (!libraryRefs.has(ref)) throw new Error(`demo-data ref not in library: ${ref}`);
  }
  for (const p of DEMO_PROJECTS) assertPartition(p.name, p.soa, libraryRefs);
  const controlIdByRef = new Map(controlRows.map((c) => [c.ref, c.id]));

  // --- Users ---------------------------------------------------------------
  const passwordHash = hashSync(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const userIdByEmail = new Map<string, string>();
  for (const u of DEMO_USERS) {
    const [row] = await db
      .insert(users)
      .values({ email: u.email, name: u.name, role: u.role, passwordHash })
      .returning();
    userIdByEmail.set(u.email, row.id);
  }
  const uid = (email: string): string => {
    const id = userIdByEmail.get(email);
    if (!id) throw new Error(`demo-data references unknown user: ${email}`);
    return id;
  };

  // --- Projects ------------------------------------------------------------
  for (const p of DEMO_PROJECTS) {
    const [project] = await db
      .insert(projects)
      .values({
        name: p.name,
        description: p.description,
        criticality: p.criticality,
        currentPhase: p.currentPhase,
        ownerId: uid(p.ownerEmail),
      })
      .returning();

    await db.insert(projectAssignments).values(
      DEMO_ASSIGNMENT_ROLES.map((a) => ({
        projectId: project.id,
        userId: uid(a.email),
        role: a.role,
      })),
    );

    // Phases + gates (6 each, contract §2)
    const phaseRows = await db
      .insert(phases)
      .values(
        p.phaseStatuses.map((status, i) => ({
          projectId: project.id,
          phaseNumber: i + 1,
          status,
        })),
      )
      .returning();
    const gateRows = await db
      .insert(gates)
      .values(phaseRows.map((ph) => ({ phaseId: ph.id })))
      .returning();
    const gateByPhase = new Map(
      gateRows.map((g) => [phaseRows.find((ph) => ph.id === g.phaseId)!.phaseNumber, g]),
    );
    for (const d of p.gates) {
      await db
        .update(gates)
        .set({
          decision: d.decision,
          rationale: d.rationale,
          decidedById: uid(d.decidedByEmail),
          decidedAt: d.decidedAt,
        })
        .where(eq(gates.id, gateByPhase.get(d.phaseNumber)!.id));
    }

    // Sentinel's closed corrective action on gate 3
    if (p.key === "sentinel") {
      const ca = SENTINEL_CORRECTIVE_ACTION;
      await db.insert(correctiveActions).values({
        gateId: gateByPhase.get(ca.gatePhaseNumber)!.id,
        description: ca.description,
        dueDate: ca.dueDate,
        status: ca.status,
        closedAt: ca.closedAt,
      });
    }

    // SoA — full clone with the planned posture
    const soaValues = [
      ...p.soa.implemented.map((ref) => ({ ref, applicability: "applicable" as const, implementationStatus: "implemented" as const, justification: "" })),
      ...p.soa.partially_implemented.map((ref) => ({ ref, applicability: "applicable" as const, implementationStatus: "partially_implemented" as const, justification: "" })),
      ...p.soa.inherited.map((ref) => ({ ref, applicability: "applicable" as const, implementationStatus: "inherited" as const, justification: "" })),
      ...p.soa.not_applicable.map((n) => ({ ref: n.ref, applicability: "not_applicable" as const, implementationStatus: "not_implemented" as const, justification: n.justification })),
      ...p.soa.not_implemented.map((ref) => ({ ref, applicability: "applicable" as const, implementationStatus: "not_implemented" as const, justification: "" })),
    ];
    const soaRows = await db
      .insert(soaEntries)
      .values(
        soaValues.map((v) => ({
          projectId: project.id,
          controlId: controlIdByRef.get(v.ref)!,
          applicability: v.applicability,
          implementationStatus: v.implementationStatus,
          justification: v.justification,
        })),
      )
      .returning();
    const soaIdByRef = new Map(
      soaRows.map((s) => [controlRows.find((c) => c.id === s.controlId)!.ref, s.id]),
    );

    // Risks
    const riskIdByTitle = new Map<string, string>();
    for (const r of p.risks) {
      const [row] = await db
        .insert(risks)
        .values({
          projectId: project.id,
          title: r.title,
          description: r.description,
          domain: r.domain,
          likelihood: r.likelihood,
          impact: r.impact,
          status: r.status,
          treatment: r.treatment,
          ownerId: uid(r.ownerEmail),
        })
        .returning();
      riskIdByTitle.set(r.title, row.id);
    }

    // Ledger's formal residual-risk acceptance (contract: risk_acceptances)
    if (p.key === "ledger") {
      await db.insert(riskAcceptances).values({
        riskId: riskIdByTitle.get(LEDGER_RISK_ACCEPTANCE.riskTitle)!,
        rationale: LEDGER_RISK_ACCEPTANCE.rationale,
        acceptedById: uid(LEDGER_RISK_ACCEPTANCE.acceptedByEmail),
        reviewBy: LEDGER_RISK_ACCEPTANCE.reviewBy,
      });
    }

    // Evidence — through the REAL ingest path: bytes hit storage, hashes verify,
    // links land in evidence_links, every ingest is audited.
    for (const e of p.evidence) {
      const links = e.links.map((l) => {
        if (l.targetType === "control") {
          const id = soaIdByRef.get(l.controlRef);
          if (!id) throw new Error(`${p.name}: evidence links unknown control ref ${l.controlRef}`);
          return { targetType: "control" as const, targetId: id };
        }
        if (l.targetType === "gate") {
          return { targetType: "gate" as const, targetId: gateByPhase.get(l.phaseNumber)!.id };
        }
        const riskId = riskIdByTitle.get(l.riskTitle);
        if (!riskId) throw new Error(`${p.name}: evidence links unknown risk "${l.riskTitle}"`);
        return { targetType: "risk" as const, targetId: riskId };
      });
      if (e.kind === "file") {
        await ingestEvidence(db, storage, {
          projectId: project.id,
          phaseNumber: e.phaseNumber,
          artifactType: e.artifactType,
          actorId: uid(e.uploadedByEmail),
          links,
          kind: "file",
          fileName: e.fileName,
          mimeType: e.mimeType,
          data: Buffer.from(e.content, "utf8"),
        });
      } else {
        await ingestEvidence(db, storage, {
          projectId: project.id,
          phaseNumber: e.phaseNumber,
          artifactType: e.artifactType,
          actorId: uid(e.uploadedByEmail),
          links,
          kind: "json",
          payload: e.payload,
        });
      }
    }

    // Sentinel's prior AEP export — the real generator (zip + manifest + hash)
    if (p.generateAep) {
      await generateAep(db, storage, project.id, uid("avery.cole@priora.demo"));
    }
  }

  // --- app_meta + closing audit entry --------------------------------------
  for (const [key, value] of [
    ["seed_profile", "demo"],
    ["seed_version", DEMO_SEED_VERSION],
  ] as const) {
    await db
      .insert(appMeta)
      .values({ key, value })
      .onConflictDoUpdate({ target: appMeta.key, set: { value, updatedAt: new Date() } });
  }
  await recordAudit(db, {
    actorId: null, // system
    action: "seed.apply",
    entityType: "app_meta",
    after: { profile: "demo", version: DEMO_SEED_VERSION },
  });

  const [{ count: evidenceCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(evidenceArtifacts);
  console.log(
    `Seeded profile=demo version=${DEMO_SEED_VERSION}: ${DEMO_USERS.length} users, ${DEMO_PROJECTS.length} projects, ${evidenceCount} evidence artifacts, 1 AEP export (password: ${DEMO_PASSWORD}).`,
  );
}
