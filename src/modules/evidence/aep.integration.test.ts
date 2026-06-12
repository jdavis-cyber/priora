// FR-15 — one click -> downloadable AEP zip whose manifest validates against the
// zod AepManifest schema; package hash recorded; exports are themselves evidence.
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { desc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  auditLog,
  controls,
  gates,
  phases,
  projects,
  soaEntries,
  users,
} from "@/db/schema";
import { createLocalStorage, type Storage } from "@/lib/storage";
import { aepManifestSchema } from "./aep-schema";
import { generateAep } from "./generate-aep";
import { computeSha256 } from "./hash";
import { ingestEvidence } from "./ingest";

let root: string;
let storage: Storage;
let userId: string;
let projectId: string;
let soaEntryId: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "priora-aep-int-"));
  storage = createLocalStorage(root);

  const [user] = await db
    .insert(users)
    .values({
      email: `m4-aep-${randomUUID()}@test.priora.local`,
      name: "M4 AEP Tester",
      passwordHash: "x",
      role: "program_manager",
    })
    .returning();
  userId = user.id;

  const [project] = await db
    .insert(projects)
    .values({ name: `M4 AEP Test ${randomUUID()}`, ownerId: userId })
    .returning();
  projectId = project.id;

  const phaseRows = await db
    .insert(phases)
    .values([1, 2, 3, 4, 5, 6].map((n) => ({ projectId, phaseNumber: n })))
    .returning();
  await db.insert(gates).values(phaseRows.map((p) => ({ phaseId: p.id })));

  const [control] = await db
    .insert(controls)
    .values({
      framework: "iso_42001",
      ref: `M4.TEST.${randomUUID().slice(0, 8)}`,
      title: "M4 test control",
    })
    .returning();
  const [soa] = await db
    .insert(soaEntries)
    .values({ projectId, controlId: control.id })
    .returning();
  soaEntryId = soa.id;
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("AEP generation", () => {
  it("packages all evidence + a schema-valid manifest, with a recorded package hash", async () => {
    const fileEvidence = await ingestEvidence(db, storage, {
      projectId,
      phaseNumber: 5,
      artifactType: "evaluation_report",
      actorId: userId,
      links: [{ targetType: "control", targetId: soaEntryId }],
      kind: "file",
      fileName: "eval.txt",
      mimeType: "text/plain",
      data: Buffer.from("evaluation findings", "utf8"),
    });
    const jsonEvidence = await ingestEvidence(db, storage, {
      projectId,
      phaseNumber: 1,
      artifactType: "mission_risk_profile",
      actorId: userId,
      links: [],
      kind: "json",
      payload: { tier: "moderate" },
    });

    const exportRow = await generateAep(db, storage, projectId, userId);

    // 1. Package hash matches the stored zip bytes
    const zipBuffer = await storage.get(exportRow.storagePath);
    expect(computeSha256(zipBuffer)).toBe(exportRow.packageSha256);
    expect(exportRow.storagePath).toBe(
      `projects/${projectId}/aep/${exportRow.id}.zip`,
    );

    // 2. The zip's manifest.json validates against the zod AepManifest schema
    const zip = new AdmZip(zipBuffer);
    const manifestEntry = zip.getEntry("manifest.json");
    expect(manifestEntry).not.toBeNull();
    const manifest = aepManifestSchema.parse(
      JSON.parse(manifestEntry!.getData().toString("utf8")),
    );
    expect(manifest.projectId).toBe(projectId);
    expect(manifest.entries).toHaveLength(2);
    expect(manifest.gateRegister).toHaveLength(6);
    expect(manifest.soaSnapshot.length).toBeGreaterThanOrEqual(1);

    // 3. The control link carries the human-readable ref
    const evalManifestEntry = manifest.entries.find(
      (e) => e.evidenceId === fileEvidence.id,
    )!;
    expect(evalManifestEntry.links[0].targetType).toBe("control");
    expect(evalManifestEntry.links[0].ref).toMatch(/^M4\.TEST\./);

    // 4. Evidence bytes are inside the zip under evidence/{evidenceId}_{fileName}
    const fileInZip = zip.getEntry(`evidence/${fileEvidence.id}_eval.txt`);
    expect(fileInZip!.getData().toString("utf8")).toBe("evaluation findings");
    const jsonInZip = zip.getEntry(`evidence/${jsonEvidence.id}_payload.json`);
    expect(JSON.parse(jsonInZip!.getData().toString("utf8"))).toEqual({
      tier: "moderate",
    });

    // 5. The export is audited
    const [audit] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, exportRow.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(1);
    expect(audit.action).toBe("aep.generate");
  });
});
