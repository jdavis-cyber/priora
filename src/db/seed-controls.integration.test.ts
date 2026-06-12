// Library seeding is idempotent: upsert on unique (framework, ref) — running twice
// must not duplicate and must refresh titles/mappings in place.
import { and, count, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { controls } from "@/db/schema";
import { CONTROL_SEEDS } from "../../seed/controls";
import { seedControls } from "../../seed/seed-controls";

describe("seedControls (integration)", () => {
  beforeAll(async () => {
    await seedControls(db);
  });

  it("inserts every seed row exactly once", async () => {
    const [{ value }] = await db.select({ value: count() }).from(controls);
    expect(value).toBe(CONTROL_SEEDS.length);
  });

  it("is idempotent — a second run changes nothing and updates in place", async () => {
    await seedControls(db);
    const [{ value }] = await db.select({ value: count() }).from(controls);
    expect(value).toBe(CONTROL_SEEDS.length);
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
