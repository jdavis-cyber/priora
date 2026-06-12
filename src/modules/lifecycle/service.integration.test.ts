// FR-05 — project creation bootstraps the full 6-phase/6-gate lifecycle atomically.
// WHY: a project with a partial lifecycle (phases without gates, or fewer than 6)
// would let work proceed ungoverned — the transaction guarantee IS the requirement.
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { auditLog, gates, phases, projects, users } from "@/db/schema";
import type { Actor } from "./service";
import { archiveProject, createProject, updateProject } from "./service";

let pm: Actor;
let aud: Actor;

beforeAll(async () => {
  const [pmRow] = await db
    .insert(users)
    .values({
      email: `pm-${randomUUID()}@test.priora.local`,
      name: "Test PM",
      passwordHash: "x",
      role: "program_manager",
    })
    .returning();
  const [audRow] = await db
    .insert(users)
    .values({
      email: `aud-${randomUUID()}@test.priora.local`,
      name: "Test Auditor",
      passwordHash: "x",
      role: "auditor",
    })
    .returning();
  pm = { id: pmRow.id, role: "program_manager" };
  aud = { id: audRow.id, role: "auditor" };
});

describe("createProject (FR-05)", () => {
  it("creates the project with 6 phases and 6 gates in one transaction; phase 1 in_progress, others not_started; gates undecided", async () => {
    const project = await createProject(db, pm, {
      name: "Lliam Governance",
      description: "Demo governed AI system",
      criticality: "high",
    });

    expect(project.currentPhase).toBe(1);
    expect(project.status).toBe("active");
    expect(project.ownerId).toBe(pm.id);

    const phaseRows = await db
      .select()
      .from(phases)
      .where(eq(phases.projectId, project.id))
      .orderBy(asc(phases.phaseNumber));
    expect(phaseRows.map((p) => p.phaseNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(phaseRows[0].status).toBe("in_progress");
    expect(phaseRows.slice(1).every((p) => p.status === "not_started")).toBe(
      true,
    );

    for (const phase of phaseRows) {
      const [gate] = await db
        .select()
        .from(gates)
        .where(eq(gates.phaseId, phase.id));
      expect(gate).toBeDefined();
      expect(gate.decision).toBeNull();
      expect(gate.decidedById).toBeNull();
    }
  });

  it("audits the creation as project.create", async () => {
    const project = await createProject(db, pm, { name: "Audit Trail Check" });
    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, project.id));
    expect(
      entries.some(
        (e) =>
          e.action === "project.create" &&
          e.entityType === "project" &&
          e.actorId === pm.id,
      ),
    ).toBe(true);
  });

  it("rejects invalid input (zod) — empty name", async () => {
    await expect(createProject(db, pm, { name: "" })).rejects.toThrow();
  });

  it("rejects unauthorized roles — auditor cannot create projects", async () => {
    await expect(
      createProject(db, aud, { name: "Auditor Project" }),
    ).rejects.toThrow(/forbidden/);
  });
});

describe("updateProject / archiveProject", () => {
  it("updates name/description/criticality and audits project.edit with before/after", async () => {
    const project = await createProject(db, pm, { name: "Before Name" });
    const updated = await updateProject(db, pm, {
      projectId: project.id,
      name: "After Name",
      criticality: "mission_critical",
    });
    expect(updated.name).toBe("After Name");
    expect(updated.criticality).toBe("mission_critical");

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, project.id));
    const edit = entries.find((e) => e.action === "project.edit");
    expect(edit).toBeDefined();
    expect(edit!.before).toBeTruthy();
    expect(edit!.after).toBeTruthy();
  });

  it("archives (status=archived) and audits project.archive; auditor blocked", async () => {
    const project = await createProject(db, pm, { name: "To Archive" });
    await expect(
      archiveProject(db, aud, { projectId: project.id }),
    ).rejects.toThrow(/forbidden/);

    // governance_lead archives (project.archive is governance_lead-only per M1 matrix)
    const [glRow] = await db
      .insert(users)
      .values({
        email: `gl-${randomUUID()}@test.priora.local`,
        name: "Test GL",
        passwordHash: "x",
        role: "governance_lead",
      })
      .returning();
    const archived = await archiveProject(
      db,
      { id: glRow.id, role: "governance_lead" },
      { projectId: project.id },
    );
    expect(archived.status).toBe("archived");

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, project.id));
    expect(entries.some((e) => e.action === "project.archive")).toBe(true);
  });
});
