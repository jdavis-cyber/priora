// Lifecycle orchestration: loads state, applies pure rules (./rules), persists,
// audits. Server actions are thin wrappers around these functions.
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { gates, phases, projects } from "@/db/schema";
import { MAX_PHASE, MIN_PHASE } from "@/lib/phases";
import { recordAudit } from "@/modules/audit/record";
import { can, type Role } from "@/modules/identity/rbac";

export type Actor = { id: string; role: Role };

function forbid(actor: Actor, action: Parameters<typeof can>[1]): void {
  if (!can(actor.role, action)) {
    throw new Error(`forbidden: ${actor.role} may not ${action}`);
  }
}

// ---------------------------------------------------------------------------
// Project CRUD (FR-05: creation bootstraps the full lifecycle atomically)
// ---------------------------------------------------------------------------

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  criticality: z
    .enum(["low", "medium", "high", "mission_critical"])
    .default("medium"),
});

export async function createProject(db: Db, actor: Actor, input: unknown) {
  forbid(actor, "project.create");
  const data = createProjectSchema.parse(input);
  return db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({ ...data, ownerId: actor.id })
      .returning();
    for (let n = MIN_PHASE; n <= MAX_PHASE; n++) {
      const [phase] = await tx
        .insert(phases)
        .values({
          projectId: project.id,
          phaseNumber: n,
          status: n === MIN_PHASE ? "in_progress" : "not_started",
        })
        .returning();
      await tx.insert(gates).values({ phaseId: phase.id });
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: "project.create",
      entityType: "project",
      entityId: project.id,
      after: project,
    });
    return project;
  });
}

export const updateProjectSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  criticality: z.enum(["low", "medium", "high", "mission_critical"]).optional(),
});

export async function updateProject(db: Db, actor: Actor, input: unknown) {
  forbid(actor, "project.edit");
  const { projectId, ...changes } = updateProjectSchema.parse(input);
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    if (!before) throw new Error("project not found");
    const [after] = await tx
      .update(projects)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();
    await recordAudit(tx, {
      actorId: actor.id,
      action: "project.edit",
      entityType: "project",
      entityId: projectId,
      before,
      after,
    });
    return after;
  });
}

export const archiveProjectSchema = z.object({ projectId: z.string().uuid() });

export async function archiveProject(db: Db, actor: Actor, input: unknown) {
  forbid(actor, "project.archive");
  const { projectId } = archiveProjectSchema.parse(input);
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    if (!before) throw new Error("project not found");
    const [after] = await tx
      .update(projects)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();
    await recordAudit(tx, {
      actorId: actor.id,
      action: "project.archive",
      entityType: "project",
      entityId: projectId,
      before,
      after,
    });
    return after;
  });
}
