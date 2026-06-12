// FR-15 — Requirement -> Control -> Evidence -> Hash traceability, relational
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { controls, phases, projects, soaEntries, users } from "@/db/schema";
import { createLocalStorage, type Storage } from "@/lib/storage";
import { evidenceChain, evidenceCountsBySoaEntry } from "./chain";
import { ingestEvidence } from "./ingest";

let root: string;
let storage: Storage;
let userId: string;
let projectId: string;
let soaEntryId: string;
let emptySoaEntryId: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "priora-chain-int-"));
  storage = createLocalStorage(root);

  const [user] = await db
    .insert(users)
    .values({
      email: `m4-chain-${randomUUID()}@test.priora.local`,
      name: "M4 Chain Tester",
      passwordHash: "x",
      role: "governance_lead",
    })
    .returning();
  userId = user.id;

  const [project] = await db
    .insert(projects)
    .values({ name: `M4 Chain Test ${randomUUID()}`, ownerId: userId })
    .returning();
  projectId = project.id;
  await db
    .insert(phases)
    .values([1, 2, 3, 4, 5, 6].map((n) => ({ projectId, phaseNumber: n })));

  const suffix = randomUUID().slice(0, 8);
  const [c1] = await db
    .insert(controls)
    .values({
      framework: "iso_42001",
      ref: `M4.CH1.${suffix}`,
      title: "Linked control",
    })
    .returning();
  const [c2] = await db
    .insert(controls)
    .values({
      framework: "iso_42001",
      ref: `M4.CH2.${suffix}`,
      title: "Unlinked control",
    })
    .returning();
  const [s1] = await db
    .insert(soaEntries)
    .values({ projectId, controlId: c1.id })
    .returning();
  const [s2] = await db
    .insert(soaEntries)
    .values({ projectId, controlId: c2.id })
    .returning();
  soaEntryId = s1.id;
  emptySoaEntryId = s2.id;

  for (const v of ["v1", "v2"]) {
    await ingestEvidence(db, storage, {
      projectId,
      phaseNumber: 1,
      artifactType: "statement_of_applicability",
      actorId: userId,
      links: [{ targetType: "control", targetId: soaEntryId }],
      kind: "file",
      fileName: "soa.txt",
      mimeType: "text/plain",
      data: Buffer.from(`soa content ${v}`, "utf8"),
    });
  }
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("evidenceChain", () => {
  it("returns control -> evidence -> hash rows for a SoA entry", async () => {
    const rows = await evidenceChain(db, soaEntryId);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.controlRef).toMatch(/^M4\.CH1\./);
      expect(row.artifactType).toBe("statement_of_applicability");
      expect(row.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(new Set(rows.map((r) => r.version))).toEqual(new Set([1, 2]));
  });

  it("returns an empty array for a control with no evidence", async () => {
    expect(await evidenceChain(db, emptySoaEntryId)).toEqual([]);
  });
});

describe("evidenceCountsBySoaEntry", () => {
  it("counts linked evidence per SoA entry for the project", async () => {
    const counts = await evidenceCountsBySoaEntry(db, projectId);
    expect(counts.get(soaEntryId)).toBe(2);
    expect(counts.get(emptySoaEntryId)).toBeUndefined();
  });
});
