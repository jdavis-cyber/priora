import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { evidenceArtifacts } from "@/db/schema";
import type { Storage } from "@/lib/storage";
import { recordAudit } from "@/modules/audit/record";
import { canonicalJson } from "./canonical-json";
import { computeSha256 } from "./hash";

export type VerifyResult = {
  evidenceId: string;
  match: boolean;
  storedSha256: string;
  computedSha256: string;
  verifiedAt: string; // ISO 8601
};

/**
 * Re-reads the stored bytes (or canonicalizes the jsonb payload), recomputes
 * SHA-256, and compares with the hash recorded at ingest. Every run is audited
 * — a verification that finds tampering is itself governance evidence.
 */
export async function verifyEvidence(
  db: Db,
  storage: Storage,
  evidenceId: string,
  actorId: string,
): Promise<VerifyResult> {
  const [row] = await db
    .select()
    .from(evidenceArtifacts)
    .where(eq(evidenceArtifacts.id, evidenceId));
  if (!row) throw new Error(`Evidence artifact not found: ${evidenceId}`);

  const computedSha256 = row.storagePath
    ? computeSha256(await storage.get(row.storagePath))
    : computeSha256(canonicalJson(row.jsonPayload));

  const match = computedSha256 === row.sha256;
  const verifiedAt = new Date().toISOString();

  await recordAudit(db, {
    actorId,
    action: "evidence.verify",
    entityType: "evidence_artifact",
    entityId: evidenceId,
    after: { match, storedSha256: row.sha256, computedSha256, verifiedAt },
  });

  return {
    evidenceId,
    match,
    storedSha256: row.sha256,
    computedSha256,
    verifiedAt,
  };
}
