import { randomUUID } from "node:crypto";
import { and, eq, isNull, max } from "drizzle-orm";
import type { Db } from "@/db";
import { evidenceArtifacts, evidenceLinks } from "@/db/schema";
import type { Storage } from "@/lib/storage";
import { recordAudit } from "@/modules/audit/record";
import { canonicalJson } from "./canonical-json";
import { computeSha256 } from "./hash";

/** Documented upload ceiling (spec §5 Evidence Locker). Enforced here AND in the server action. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export type EvidenceLinkInput = {
  targetType: "control" | "gate" | "risk"; // control -> soa_entries.id (contract §1)
  targetId: string;
};

export type IngestInput = {
  projectId: string;
  phaseNumber: number; // 1..6
  artifactType: string; // validated against ARTIFACT_TYPES upstream
  actorId: string;
  links: EvidenceLinkInput[];
} & (
  | { kind: "file"; fileName: string; mimeType: string; data: Buffer }
  | { kind: "json"; payload: unknown }
);

export function evidenceStoragePath(
  projectId: string,
  phaseNumber: number,
  evidenceId: string,
  fileName: string,
): string {
  return `projects/${projectId}/phase_${phaseNumber}/${evidenceId}/${fileName}`;
}

/** Version rule: same projectId + artifactType + fileName => max existing + 1. */
export function resolveVersion(existingMax: number | null): number {
  return (existingMax ?? 0) + 1;
}

async function maxExistingVersion(
  db: Db,
  projectId: string,
  artifactType: string,
  fileName: string | null,
): Promise<number | null> {
  const [row] = await db
    .select({ maxVersion: max(evidenceArtifacts.version) })
    .from(evidenceArtifacts)
    .where(
      and(
        eq(evidenceArtifacts.projectId, projectId),
        eq(evidenceArtifacts.artifactType, artifactType),
        fileName === null
          ? isNull(evidenceArtifacts.fileName)
          : eq(evidenceArtifacts.fileName, fileName),
      ),
    );
  return row?.maxVersion ?? null;
}

export async function ingestEvidence(
  db: Db,
  storage: Storage,
  input: IngestInput,
) {
  if (input.kind === "file" && input.data.length > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File exceeds the ${MAX_UPLOAD_BYTES} byte (25 MB) upload limit`,
    );
  }

  const evidenceId = randomUUID();
  const fileName = input.kind === "file" ? input.fileName : null;
  const sha256 =
    input.kind === "file"
      ? computeSha256(input.data)
      : computeSha256(canonicalJson(input.payload));
  const version = resolveVersion(
    await maxExistingVersion(db, input.projectId, input.artifactType, fileName),
  );

  let storagePath: string | null = null;
  if (input.kind === "file") {
    storagePath = evidenceStoragePath(
      input.projectId,
      input.phaseNumber,
      evidenceId,
      input.fileName,
    );
    await storage.put(storagePath, input.data);
  }

  const [row] = await db
    .insert(evidenceArtifacts)
    .values({
      id: evidenceId,
      projectId: input.projectId,
      phaseNumber: input.phaseNumber,
      artifactType: input.artifactType,
      fileName,
      storagePath,
      mimeType: input.kind === "file" ? input.mimeType : null,
      sizeBytes: input.kind === "file" ? input.data.length : null,
      jsonPayload: input.kind === "json" ? input.payload : null,
      sha256,
      version,
      uploadedById: input.actorId,
    })
    .returning();

  if (input.links.length > 0) {
    await db.insert(evidenceLinks).values(
      input.links.map((l) => ({
        evidenceId,
        targetType: l.targetType,
        targetId: l.targetId,
      })),
    );
  }

  await recordAudit(db, {
    actorId: input.actorId,
    action: "evidence.ingest",
    entityType: "evidence_artifact",
    entityId: evidenceId,
    after: {
      artifactType: input.artifactType,
      fileName,
      sha256,
      version,
      links: input.links,
    },
  });

  return row;
}
