// M1 harness smoke test — proves the integration suite reaches a real Postgres.
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

afterAll(async () => {
  await pool.end();
});

describe("database connection", () => {
  it("answers SELECT 1 and has the domain schema applied", async () => {
    const one = await pool.query("SELECT 1 AS ok");
    expect(one.rows[0].ok).toBe(1);

    const tables = await pool.query(
      `SELECT count(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'audit_log'`,
    );
    expect(tables.rows[0].n).toBe(1);
  });
});
