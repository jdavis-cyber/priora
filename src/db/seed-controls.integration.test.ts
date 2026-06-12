// Library seeding is idempotent: upsert on unique (framework, ref) — running twice
// must not duplicate and must refresh titles/mappings in place.
// Counts are scoped to the seed's own (framework, ref) keys: other integration
// suites insert fixture controls into the same shared table.
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { controls } from "@/db/schema";
import { CONTROL_SEEDS } from "../../seed/controls";
import { seedControls } from "../../seed/seed-controls";

async function seedOwnedCount(): Promise<number> {
  const rows = await db
    .select({ framework: controls.framework, ref: controls.ref })
    .from(controls);
  const seedKeys = new Set(CONTROL_SEEDS.map((c) => `${c.framework}:${c.ref}`));
  return rows.filter((r) => seedKeys.has(`${r.framework}:${r.ref}`)).length;
}

describe("seedControls (integration)", () => {
  beforeAll(async () => {
    await seedControls(db);
  });

  it("inserts every seed row exactly once", async () => {
    expect(await seedOwnedCount()).toBe(CONTROL_SEEDS.length);
  });

  it("is idempotent — a second run changes nothing and updates in place", async () => {
    await seedControls(db);
    expect(await seedOwnedCount()).toBe(CONTROL_SEEDS.length);
    const [row] = await db
      .select()
      .from(controls)
      .where(
        and(eq(controls.framework, "iso_42001"), eq(controls.ref, "A.5.2")),
      );
    expect(row.title).toBe("Establish a process for assessing AI system impacts");
    expect(row.csrmcElement).toBe("MRP");
  });
});
