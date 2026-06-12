// FR-13 / FR-14 — integration: ingest computes sha256 server-side; versioning = max+1;
// tampering a stored file on disk is detected by re-verification.
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  auditLog,
  evidenceArtifacts,
  evidenceLinks,
  phases,
  projects,
  users,
} from "@/db/schema";
import { createLocalStorage, type Storage } from "@/lib/storage";
import { computeSha256 } from "./hash";
import { ingestEvidence } from "./ingest";
import { verifyEvidence } from "./verify";

let root: string;
let storage: Storage;
let userId: string;
let projectId: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "priora-evidence-int-"));
  storage = createLocalStorage(root);

  const [user] = await db
    .insert(users)
    .values({
      email: `m4-evidence-${randomUUID()}@test.priora.local`,
      name: "M4 Test User",
      passwordHash: "x",
      role: "ml_engineer",
    })
    .returning();
  userId = user.id;

  const [project] = await db
    .insert(projects)
    .values({ name: `M4 Evidence Test ${randomUUID()}`, ownerId: userId })
    .returning();
  projectId = project.id;

  await db
    .insert(phases)
    .values([1, 2, 3, 4, 5, 6].map((n) => ({ projectId, phaseNumber: n })));
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("evidence ingest", () => {
  it("stores the file via the storage abstraction and records its sha256", async () => {
    const data = Buffer.from("quarterly evaluation report v1", "utf8");
    const row = await ingestEvidence(db, storage, {
      projectId,
      phaseNumber: 5,
      artifactType: "evaluation_report",
      actorId: userId,
      links: [],
      kind: "file",
      fileName: "eval-report.txt",
      mimeType: "text/plain",
      data,
    });

    expect(row.sha256).toBe(computeSha256(data));
    expect(row.version).toBe(1);
    expect(row.storagePath).toBe(
      `projects/${projectId}/phase_5/${row.id}/eval-report.txt`,
    );
    expect((await storage.get(row.storagePath!)).equals(data)).toBe(true);

    const [audit] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, row.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(1);
    expect(audit.action).toBe("evidence.ingest");
  });

  it("increments version for the same projectId + artifactType + fileName", async () => {
    const again = await ingestEvidence(db, storage, {
      projectId,
      phaseNumber: 5,
      artifactType: "evaluation_report",
      actorId: userId,
      links: [],
      kind: "file",
      fileName: "eval-report.txt",
      mimeType: "text/plain",
      data: Buffer.from("quarterly evaluation report v2", "utf8"),
    });
    expect(again.version).toBe(2);
  });

  it("ingests an inline JSON payload with a canonical hash and no storagePath", async () => {
    const row = await ingestEvidence(db, storage, {
      projectId,
      phaseNumber: 1,
      artifactType: "mission_risk_profile",
      actorId: userId,
      links: [],
      kind: "json",
      payload: {
        tier: "high",
        rationale: "mission critical",
        domains: ["privacy", "cyber"],
      },
    });
    expect(row.storagePath).toBeNull();
    expect(row.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("integrity verification (tamper detection)", () => {
  it("matches for an untouched file, mismatches after on-disk tampering", async () => {
    const data = Buffer.from("original model card", "utf8");
    const row = await ingestEvidence(db, storage, {
      projectId,
      phaseNumber: 4,
      artifactType: "model_card",
      actorId: userId,
      links: [],
      kind: "file",
      fileName: "model-card.md",
      mimeType: "text/markdown",
      data,
    });

    const before = await verifyEvidence(db, storage, row.id, userId);
    expect(before.match).toBe(true);

    // Tamper: bypass the abstraction and rewrite the stored bytes directly on disk.
    await writeFile(path.join(root, row.storagePath!), "TAMPERED CONTENT");

    const after = await verifyEvidence(db, storage, row.id, userId);
    expect(after.match).toBe(false);
    expect(after.storedSha256).toBe(row.sha256);
    expect(after.computedSha256).not.toBe(row.sha256);

    const audits = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, row.id))
      .orderBy(desc(auditLog.createdAt));
    expect(audits.filter((a) => a.action === "evidence.verify").length).toBe(2);
  });

  it("re-verifies inline JSON payloads through the jsonb round-trip", async () => {
    const row = await ingestEvidence(db, storage, {
      projectId,
      phaseNumber: 1,
      artifactType: "stakeholder_register",
      actorId: userId,
      links: [],
      kind: "json",
      payload: { zeta: 1, alpha: { nested: true, arr: [2, 1] } },
    });
    const result = await verifyEvidence(db, storage, row.id, userId);
    expect(result.match).toBe(true);
  });
});
