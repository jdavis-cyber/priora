import { createHash } from "node:crypto";

/** Lowercase hex SHA-256, 64 chars. Contract §3 — used at ingest, verify, and AEP packaging. */
export function computeSha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}
