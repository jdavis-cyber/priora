// NFR-01 (read side) — the audit trail is browsable: filterable and
// cursor-paginated without skipping or duplicating rows.
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema";
import { recordAudit } from "@/modules/audit/record";
import { queryAuditLog } from "./audit-query";

describe("queryAuditLog", () => {
  it("filters by action and paginates by cursor without overlap", async () => {
    const [actor] = await db
      .insert(users)
      .values({
        email: `m5-audit-${randomUUID()}@test.priora.local`,
        name: "M5 Audit Tester",
        passwordHash: "x",
        role: "governance_lead",
      })
      .returning();
    const marker = `m5.test.${randomUUID().slice(0, 8)}`;
    for (let i = 0; i < 5; i++) {
      await recordAudit(db, {
        actorId: actor.id,
        action: marker,
        entityType: "m5_fixture",
        after: { i },
      });
    }

    const page1 = await queryAuditLog(db, { action: marker, limit: 2 });
    expect(page1.entries).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();
    expect(page1.entries[0].actorEmail).toBe(actor.email);

    const page2 = await queryAuditLog(db, { action: marker, limit: 2, cursor: page1.nextCursor! });
    const page3 = await queryAuditLog(db, { action: marker, limit: 2, cursor: page2.nextCursor! });
    expect(page3.entries).toHaveLength(1);
    expect(page3.nextCursor).toBeNull();

    const ids = [...page1.entries, ...page2.entries, ...page3.entries].map((e) => e.id);
    expect(new Set(ids).size).toBe(5); // no overlap, no skips
  });

  it("filters by actor and date range", async () => {
    const [actor] = await db
      .insert(users)
      .values({
        email: `m5-audit-range-${randomUUID()}@test.priora.local`,
        name: "M5 Range Tester",
        passwordHash: "x",
        role: "governance_lead",
      })
      .returning();
    await recordAudit(db, { actorId: actor.id, action: "m5.range", entityType: "m5_fixture" });

    const hit = await queryAuditLog(db, {
      actorId: actor.id,
      from: new Date(Date.now() - 60_000),
      to: new Date(Date.now() + 60_000),
      limit: 10,
    });
    expect(hit.entries.length).toBe(1);

    const miss = await queryAuditLog(db, {
      actorId: actor.id,
      to: new Date(Date.now() - 60_000),
      limit: 10,
    });
    expect(miss.entries.length).toBe(0);
  });
});
