import { and, count, eq } from "drizzle-orm";
import type { Db } from "@/db";
import {
  controls,
  evidenceArtifacts,
  evidenceLinks,
  soaEntries,
} from "@/db/schema";

export type EvidenceChainRow = {
  controlRef: string;
  controlTitle: string;
  evidenceId: string;
  artifactType: string;
  fileName: string | null;
  version: number;
  sha256: string;
};

/**
 * The Requirement -> Control -> Evidence -> Hash traceability chain for one
 * project-scoped control (SoA entry). Simple joins — no recursive CTE needed
 * at this depth (links are evidence->target edges, one hop).
 */
export async function evidenceChain(
  db: Db,
  soaEntryId: string,
): Promise<EvidenceChainRow[]> {
  return db
    .select({
      controlRef: controls.ref,
      controlTitle: controls.title,
      evidenceId: evidenceArtifacts.id,
      artifactType: evidenceArtifacts.artifactType,
      fileName: evidenceArtifacts.fileName,
      version: evidenceArtifacts.version,
      sha256: evidenceArtifacts.sha256,
    })
    .from(evidenceLinks)
    .innerJoin(
      evidenceArtifacts,
      eq(evidenceLinks.evidenceId, evidenceArtifacts.id),
    )
    .innerJoin(soaEntries, eq(evidenceLinks.targetId, soaEntries.id))
    .innerJoin(controls, eq(soaEntries.controlId, controls.id))
    .where(
      and(
        eq(evidenceLinks.targetType, "control"),
        eq(evidenceLinks.targetId, soaEntryId),
      ),
    )
    .orderBy(evidenceArtifacts.version);
}

/** Per-control evidence counts for the SoA page (one grouped query, not N+1). */
export async function evidenceCountsBySoaEntry(
  db: Db,
  projectId: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({ soaEntryId: evidenceLinks.targetId, n: count(evidenceLinks.id) })
    .from(evidenceLinks)
    .innerJoin(soaEntries, eq(evidenceLinks.targetId, soaEntries.id))
    .where(
      and(
        eq(evidenceLinks.targetType, "control"),
        eq(soaEntries.projectId, projectId),
      ),
    )
    .groupBy(evidenceLinks.targetId);
  return new Map(rows.map((r) => [r.soaEntryId, Number(r.n)]));
}
