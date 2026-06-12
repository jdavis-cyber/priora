// NFR-01 (SRD 5.1; spec §4 "Accountability") — audit rows must be tamper-evident:
// the DATABASE rejects UPDATE/DELETE on audit_log, regardless of application code.
//   Layer 1 (privilege): runtime role priora_app has no UPDATE/DELETE grant.
//   Layer 2 (trigger):   even the owner role hits a BEFORE UPDATE OR DELETE exception.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { recordAudit } from "./record";

const owner = new Pool({ connectionString: process.env.DATABASE_URL });
const app = new Pool({ connectionString: process.env.APP_DATABASE_URL });

let rowId: string;

beforeAll(async () => {
  // Write through the real helper, under the real runtime role.
  const appDb = drizzle(app, { schema });
  await recordAudit(appDb, {
    actorId: null,
    action: "test.append_only",
    entityType: "test",
  });
  const res = await app.query(
    `SELECT id FROM audit_log WHERE action = 'test.append_only' ORDER BY created_at DESC LIMIT 1`,
  );
  rowId = res.rows[0].id;
});

afterAll(async () => {
  await owner.end();
  await app.end();
});

describe("audit_log append-only enforcement (NFR-01)", () => {
  it("lets the app role INSERT (via recordAudit) and SELECT", async () => {
    const res = await app.query(`SELECT action FROM audit_log WHERE id = $1`, [
      rowId,
    ]);
    expect(res.rows[0].action).toBe("test.append_only");
  });

  it("blocks UPDATE by the app role — privilege layer", async () => {
    await expect(
      app.query(`UPDATE audit_log SET action = 'tampered' WHERE id = $1`, [
        rowId,
      ]),
    ).rejects.toThrow(/permission denied/);
  });

  it("blocks DELETE by the app role — privilege layer", async () => {
    await expect(
      app.query(`DELETE FROM audit_log WHERE id = $1`, [rowId]),
    ).rejects.toThrow(/permission denied/);
  });

  it("blocks UPDATE even by the owner role — trigger layer", async () => {
    await expect(
      owner.query(`UPDATE audit_log SET action = 'tampered' WHERE id = $1`, [
        rowId,
      ]),
    ).rejects.toThrow(/append-only/);
  });

  it("blocks DELETE even by the owner role — trigger layer", async () => {
    await expect(
      owner.query(`DELETE FROM audit_log WHERE id = $1`, [rowId]),
    ).rejects.toThrow(/append-only/);
  });
});
