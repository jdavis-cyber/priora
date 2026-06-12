// Lifecycle orchestration: loads state, applies pure rules (./rules), persists,
// audits. Server actions are thin wrappers around these functions.
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { correctiveActions, gates, phases, projects } from "@/db/schema";
import { MAX_PHASE, MIN_PHASE } from "@/lib/phases";
import { recordAudit } from "@/modules/audit/record";
import { can, type Role } from "@/modules/identity/rbac";
import { canDecideGate, evaluateAdvance, type AdvanceResult } from "./rules";

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
    // FR-10: clone the control library into the project's SoA (defaults —
    // applicable / '' / not_implemented — come from the schema).
    await tx.execute(sql`
      INSERT INTO soa_entries (project_id, control_id)
      SELECT ${project.id}, id FROM controls
    `);
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

// ---------------------------------------------------------------------------
// Gate decision (FR-06: tri-state, authorized roles only, conditions tracked)
// ---------------------------------------------------------------------------

export const decideGateSchema = z
  .object({
    gateId: z.string().uuid(),
    decision: z.enum(["approved", "conditionally_approved", "not_approved"]),
    rationale: z.string().min(1, "rationale is required"),
    correctiveActions: z
      .array(
        z.object({
          description: z.string().min(1, "description is required"),
          dueDate: z.coerce.date(),
        }),
      )
      .default([]),
  })
  .superRefine((val, ctx) => {
    if (
      val.decision === "conditionally_approved" &&
      val.correctiveActions.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctiveActions"],
        message:
          "conditionally_approved requires at least one corrective action (description + due date)",
      });
    }
  });

// Re-deciding an already-decided gate is permitted in v1 (the before/after audit
// diff preserves the full history); corrective actions supplied with
// approved/not_approved are ignored, not created.
export async function decideGate(db: Db, actor: Actor, input: unknown) {
  if (!canDecideGate(actor.role)) {
    throw new Error(`forbidden: ${actor.role} may not gate.decide`);
  }
  const data = decideGateSchema.parse(input);
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(gates)
      .where(eq(gates.id, data.gateId));
    if (!before) throw new Error("gate not found");
    const [after] = await tx
      .update(gates)
      .set({
        decision: data.decision,
        rationale: data.rationale,
        decidedById: actor.id,
        decidedAt: new Date(),
      })
      .where(eq(gates.id, data.gateId))
      .returning();
    if (data.decision === "conditionally_approved") {
      await tx.insert(correctiveActions).values(
        data.correctiveActions.map((ca) => ({
          gateId: data.gateId,
          description: ca.description,
          dueDate: ca.dueDate,
        })),
      );
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: "gate.decide",
      entityType: "gate",
      entityId: data.gateId,
      before,
      after,
    });
    return after;
  });
}

// ---------------------------------------------------------------------------
// Phase advance (FR-05/FR-06: persist exactly what evaluateAdvance permits)
// ---------------------------------------------------------------------------

export const advancePhaseSchema = z.object({ projectId: z.string().uuid() });

export async function advancePhase(
  db: Db,
  actor: Actor,
  input: unknown,
): Promise<AdvanceResult> {
  const { projectId } = advancePhaseSchema.parse(input);
  return db.transaction(async (tx) => {
    const [project] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    if (!project) throw new Error("project not found");
    const [currentPhase] = await tx
      .select()
      .from(phases)
      .where(
        and(
          eq(phases.projectId, project.id),
          eq(phases.phaseNumber, project.currentPhase),
        ),
      );
    if (!currentPhase) throw new Error("current phase row missing");
    const [gate] = await tx
      .select()
      .from(gates)
      .where(eq(gates.phaseId, currentPhase.id));
    if (!gate) throw new Error("gate row missing");

    const result = evaluateAdvance(
      project.currentPhase,
      { decision: gate.decision },
      actor.role,
    );
    if (!result.ok) return result;

    await tx
      .update(phases)
      .set({ status: "complete" })
      .where(eq(phases.id, currentPhase.id));
    await tx
      .update(phases)
      .set({ status: "in_progress" })
      .where(
        and(
          eq(phases.projectId, project.id),
          eq(phases.phaseNumber, result.nextPhase),
        ),
      );
    await tx
      .update(projects)
      .set({ currentPhase: result.nextPhase, updatedAt: new Date() })
      .where(eq(projects.id, project.id));
    await recordAudit(tx, {
      actorId: actor.id,
      action: "phase.advance",
      entityType: "project",
      entityId: project.id,
      before: { currentPhase: project.currentPhase },
      after: { currentPhase: result.nextPhase },
    });
    return result;
  });
}

// ---------------------------------------------------------------------------
// Corrective action close. The contract's Action union has no dedicated
// corrective-action permission; closure is gated on `project.edit`
// (governance_lead + program_manager) — the roles operationally accountable
// for working off gate conditions. Recorded as a resolved ambiguity in the
// plan's self-review; promoting it to a first-class Action is a contract
// change requiring an ADR.
// ---------------------------------------------------------------------------

export const closeCorrectiveActionSchema = z.object({
  correctiveActionId: z.string().uuid(),
});

export async function closeCorrectiveAction(
  db: Db,
  actor: Actor,
  input: unknown,
) {
  forbid(actor, "project.edit");
  const { correctiveActionId } = closeCorrectiveActionSchema.parse(input);
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(correctiveActions)
      .where(eq(correctiveActions.id, correctiveActionId));
    if (!before) throw new Error("corrective action not found");
    const [after] = await tx
      .update(correctiveActions)
      .set({ status: "closed", closedAt: new Date() })
      .where(eq(correctiveActions.id, correctiveActionId))
      .returning();
    await recordAudit(tx, {
      actorId: actor.id,
      action: "corrective_action.close",
      entityType: "corrective_action",
      entityId: correctiveActionId,
      before,
      after,
    });
    return after;
  });
}
