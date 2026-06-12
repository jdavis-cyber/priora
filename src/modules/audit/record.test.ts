// NFR-01 (SRD 5.1) — append-only audit log, write side. recordAudit must persist the
// full accountability tuple (actor, action, entity, before/after) and normalize
// omitted fields to null so audit rows are uniformly queryable.
import { describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { recordAudit } from "./record";

function fakeDb() {
  const rows: Record<string, unknown>[] = [];
  const db = {
    insert: () => ({
      values: async (v: Record<string, unknown>) => {
        rows.push(v);
      },
    }),
  } as unknown as Db;
  return { db, rows };
}

describe("recordAudit", () => {
  it("inserts the full entry", async () => {
    const { db, rows } = fakeDb();
    await recordAudit(db, {
      actorId: "11111111-1111-1111-1111-111111111111",
      action: "project.create",
      entityType: "project",
      entityId: "22222222-2222-2222-2222-222222222222",
      before: null,
      after: { name: "Lliam" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorId: "11111111-1111-1111-1111-111111111111",
      action: "project.create",
      entityType: "project",
      entityId: "22222222-2222-2222-2222-222222222222",
      after: { name: "Lliam" },
    });
  });

  it("normalizes omitted optional fields to null (system actor allowed)", async () => {
    const { db, rows } = fakeDb();
    await recordAudit(db, {
      actorId: null, // null = system action (contract §2 audit_log comment)
      action: "seed.apply",
      entityType: "app_meta",
    });
    expect(rows[0]).toMatchObject({
      actorId: null,
      entityId: null,
      before: null,
      after: null,
    });
  });
});
