import { randomUUID } from "node:crypto";
import { PassThrough } from "node:stream";
// archiver pinned to v7: the v8 class rewrite has no type declarations yet
// and @types/archiver targets the v7 factory API.
import archiver from "archiver";
import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import {
  aepExports,
  controls,
  evidenceArtifacts,
  evidenceLinks,
  gates,
  phases,
  projects,
  risks,
  soaEntries,
} from "@/db/schema";
import type { Storage } from "@/lib/storage";
import { recordAudit } from "@/modules/audit/record";
import { buildAepManifest, type AepManifest } from "./aep";
import { canonicalJson } from "./canonical-json";
import { computeSha256 } from "./hash";

/** Pure-ish zip assembly: manifest.json + evidence/{name} entries -> one Buffer. */
export async function zipAep(
  manifest: AepManifest,
  files: { name: string; data: Buffer }[],
): Promise<Buffer> {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const out = new PassThrough();
  const chunks: Buffer[] = [];
  out.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<void>((resolve, reject) => {
    out.on("end", resolve);
    archive.on("error", reject);
  });
  archive.pipe(out);
  archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
  for (const f of files) {
    archive.append(f.data, { name: `evidence/${f.name}` });
  }
  await archive.finalize();
  await done;
  return Buffer.concat(chunks);
}

export async function generateAep(
  db: Db,
  storage: Storage,
  projectId: string,
  actorId: string,
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const evidence = await db
    .select()
    .from(evidenceArtifacts)
    .where(eq(evidenceArtifacts.projectId, projectId));

  const rawLinks = await db
    .select({
      evidenceId: evidenceLinks.evidenceId,
      targetType: evidenceLinks.targetType,
      targetId: evidenceLinks.targetId,
    })
    .from(evidenceLinks)
    .innerJoin(
      evidenceArtifacts,
      eq(evidenceLinks.evidenceId, evidenceArtifacts.id),
    )
    .where(eq(evidenceArtifacts.projectId, projectId));

  // Human-readable refs for the manifest's links
  const soaRefs = await db
    .select({ id: soaEntries.id, ref: controls.ref })
    .from(soaEntries)
    .innerJoin(controls, eq(soaEntries.controlId, controls.id))
    .where(eq(soaEntries.projectId, projectId));
  const gateRefs = await db
    .select({ id: gates.id, phaseNumber: phases.phaseNumber })
    .from(gates)
    .innerJoin(phases, eq(gates.phaseId, phases.id))
    .where(eq(phases.projectId, projectId));
  const riskRefs = await db
    .select({ id: risks.id, title: risks.title })
    .from(risks)
    .where(eq(risks.projectId, projectId));
  const refMap = new Map<string, string>([
    ...soaRefs.map((r) => [r.id, r.ref] as const),
    ...gateRefs.map((g) => [g.id, `Phase ${g.phaseNumber} gate`] as const),
    ...riskRefs.map((r) => [r.id, r.title] as const),
  ]);

  const gateRegister = await db
    .select({
      phaseNumber: phases.phaseNumber,
      decision: gates.decision,
      rationale: gates.rationale,
      decidedById: gates.decidedById,
      decidedAt: gates.decidedAt,
    })
    .from(gates)
    .innerJoin(phases, eq(gates.phaseId, phases.id))
    .where(eq(phases.projectId, projectId))
    .orderBy(phases.phaseNumber);

  const soaSnapshot = await db
    .select({
      ref: controls.ref,
      framework: controls.framework,
      applicability: soaEntries.applicability,
      justification: soaEntries.justification,
      implementationStatus: soaEntries.implementationStatus,
    })
    .from(soaEntries)
    .innerJoin(controls, eq(soaEntries.controlId, controls.id))
    .where(eq(soaEntries.projectId, projectId))
    .orderBy(controls.ref);

  const exportId = randomUUID();
  const generatedAt = new Date().toISOString();

  const manifest = buildAepManifest({
    project: { id: project.id, name: project.name },
    generatedBy: actorId,
    generatedAt,
    evidence: evidence.map((e) => ({
      id: e.id,
      artifactType: e.artifactType,
      fileName: e.fileName,
      sha256: e.sha256,
      version: e.version,
      phaseNumber: e.phaseNumber,
    })),
    links: rawLinks.map((l) => ({
      evidenceId: l.evidenceId,
      targetType: l.targetType,
      targetId: l.targetId,
      ...(refMap.has(l.targetId) ? { ref: refMap.get(l.targetId)! } : {}),
    })),
    gateRegister,
    soaSnapshot,
  });

  const files: { name: string; data: Buffer }[] = [];
  for (const e of evidence) {
    if (e.storagePath) {
      files.push({
        name: `${e.id}_${e.fileName}`,
        data: await storage.get(e.storagePath),
      });
    } else {
      files.push({
        name: `${e.id}_payload.json`,
        data: Buffer.from(canonicalJson(e.jsonPayload), "utf8"),
      });
    }
  }

  const zipBuffer = await zipAep(manifest, files);
  const packageSha256 = computeSha256(zipBuffer);
  const storagePath = `projects/${projectId}/aep/${exportId}.zip`;
  await storage.put(storagePath, zipBuffer);

  const [row] = await db
    .insert(aepExports)
    .values({
      id: exportId,
      projectId,
      manifest,
      packageSha256,
      storagePath,
      generatedById: actorId,
    })
    .returning();

  await recordAudit(db, {
    actorId,
    action: "aep.generate",
    entityType: "aep_export",
    entityId: exportId,
    after: { packageSha256, storagePath, entryCount: manifest.entries.length },
  });

  return row;
}
