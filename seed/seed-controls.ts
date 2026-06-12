// Idempotent control-library seeder. Upsert keyed on the contract's
// unique(framework, ref). Safe to run on every deploy / profile seed.
import "dotenv/config"; // CLI entry needs env; harmless under vitest/seed-profile imports
import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { controls } from "@/db/schema";
import { CONTROL_SEEDS } from "./controls";

export async function seedControls(db: Db): Promise<void> {
  await db
    .insert(controls)
    .values(CONTROL_SEEDS)
    .onConflictDoUpdate({
      target: [controls.framework, controls.ref],
      set: {
        title: sql`excluded.title`,
        isoClause: sql`excluded.iso_clause`,
        aiRmfFunction: sql`excluded.ai_rmf_function`,
        csrmcElement: sql`excluded.csrmc_element`,
      },
    });
}

// CLI entry: npm run seed:controls
if (process.argv[1]?.endsWith("seed-controls.ts")) {
  import("@/db").then(async ({ db }) => {
    await seedControls(db);
    console.log(`seeded ${CONTROL_SEEDS.length} controls (idempotent upsert)`);
    process.exit(0);
  });
}
