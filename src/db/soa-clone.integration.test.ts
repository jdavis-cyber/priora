// Spec §5: project creation clones the control library into soa_entries —
// one insert-select, same transaction as project + phases + gates (FR-10).
import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { controls, soaEntries, users } from "@/db/schema";
import { createProject } from "@/modules/lifecycle/service";
import { seedControls } from "../../seed/seed-controls";

describe("SoA clone on project creation (integration)", () => {
  let projectId: string;

  beforeAll(async () => {
    await seedControls(db);
    const [pm] = await db
      .insert(users)
      .values({
        email: `pm-soa-${randomUUID()}@test.priora.local`,
        name: "SoA Test PM",
        passwordHash: "x",
        role: "program_manager",
      })
      .returning();
    const project = await createProject(
      db,
      { id: pm.id, role: "program_manager" },
      { name: "SoA Clone Test Project" },
    );
    projectId = project.id;
  });

  it("creates one soa_entry per library control, defaulted applicable/not_implemented", async () => {
    const [{ value: libCount }] = await db
      .select({ value: count() })
      .from(controls);
    const rows = await db
      .select()
      .from(soaEntries)
      .where(eq(soaEntries.projectId, projectId));
    expect(rows).toHaveLength(libCount);
    for (const r of rows) {
      expect(r.applicability).toBe("applicable");
      expect(r.implementationStatus).toBe("not_implemented");
      expect(r.justification).toBe("");
    }
  });
});
