// FR-05 / FR-06 — phase advancement persists what evaluateAdvance permits and
// nothing else; includes the milestone proof: a project walks I→VI gate by gate.
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  auditLog,
  correctiveActions,
  gates,
  phases,
  projects,
  users,
} from "@/db/schema";
import type { Actor } from "./service";
import {
  advancePhase,
  closeCorrectiveAction,
  createProject,
  decideGate,
} from "./service";

let gl: Actor;
let pm: Actor;
let mle: Actor;

async function makeUser(
  role: "governance_lead" | "program_manager" | "ml_engineer",
) {
  const [row] = await db
    .insert(users)
    .values({
      email: `${role}-${randomUUID()}@test.priora.local`,
      name: `Test ${role}`,
      passwordHash: "x",
      role,
    })
    .returning();
  return { id: row.id, role } as Actor;
}

async function gateForPhase(projectId: string, phaseNumber: number) {
  const [phase] = await db
    .select()
    .from(phases)
    .where(
      and(eq(phases.projectId, projectId), eq(phases.phaseNumber, phaseNumber)),
    );
  const [gate] = await db
    .select()
    .from(gates)
    .where(eq(gates.phaseId, phase.id));
  return gate;
}

beforeAll(async () => {
  gl = await makeUser("governance_lead");
  pm = await makeUser("program_manager");
  mle = await makeUser("ml_engineer");
});

describe("advancePhase (FR-05/FR-06)", () => {
  it("blocks when the gate is undecided; nothing persisted", async () => {
    const project = await createProject(db, pm, { name: "Advance Undecided" });
    const result = await advancePhase(db, pm, { projectId: project.id });
    expect(result).toEqual({ ok: false, reason: "gate_not_decided" });

    const [fresh] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, project.id));
    expect(fresh.currentPhase).toBe(1);
  });

  it("blocks on not_approved (TC-008); blocks unauthorized roles (TC-009)", async () => {
    const project = await createProject(db, pm, { name: "Advance Blocked" });
    const gate = await gateForPhase(project.id, 1);
    await decideGate(db, gl, {
      gateId: gate.id,
      decision: "not_approved",
      rationale: "Insufficient business case.",
    });

    expect(await advancePhase(db, pm, { projectId: project.id })).toEqual({
      ok: false,
      reason: "gate_not_approved",
    });
    expect(await advancePhase(db, mle, { projectId: project.id })).toEqual({
      ok: false,
      reason: "not_authorized",
    });
  });

  it("on approval: marks phase complete, next in_progress, bumps currentPhase, audits phase.advance", async () => {
    const project = await createProject(db, pm, { name: "Advance OK" });
    const gate = await gateForPhase(project.id, 1);
    await decideGate(db, gl, {
      gateId: gate.id,
      decision: "approved",
      rationale: "Phase I complete.",
    });

    const result = await advancePhase(db, pm, { projectId: project.id });
    expect(result).toEqual({ ok: true, nextPhase: 2 });

    const phaseRows = await db
      .select()
      .from(phases)
      .where(eq(phases.projectId, project.id))
      .orderBy(asc(phases.phaseNumber));
    expect(phaseRows[0].status).toBe("complete");
    expect(phaseRows[1].status).toBe("in_progress");

    const [fresh] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, project.id));
    expect(fresh.currentPhase).toBe(2);

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, project.id));
    expect(entries.some((e) => e.action === "phase.advance")).toBe(true);
  });

  it("MILESTONE PROOF: walks I→VI mixing approved and conditionally_approved; phase 6 is final (TC-005, TC-007)", async () => {
    const project = await createProject(db, pm, { name: "Full Walk I-VI" });
    const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    for (let n = 1; n <= 5; n++) {
      const gate = await gateForPhase(project.id, n);
      if (n === 2) {
        await decideGate(db, gl, {
          gateId: gate.id,
          decision: "conditionally_approved",
          rationale: `Phase ${n} approved with conditions.`,
          correctiveActions: [
            { description: `Close out phase ${n} condition`, dueDate: due },
          ],
        });
      } else {
        await decideGate(db, gl, {
          gateId: gate.id,
          decision: "approved",
          rationale: `Phase ${n} complete.`,
        });
      }
      const result = await advancePhase(db, pm, { projectId: project.id });
      expect(result).toEqual({ ok: true, nextPhase: n + 1 });
    }

    const [fresh] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, project.id));
    expect(fresh.currentPhase).toBe(6);

    // Phase 6 is final — even an approved gate 6 cannot advance further.
    const gate6 = await gateForPhase(project.id, 6);
    await decideGate(db, gl, {
      gateId: gate6.id,
      decision: "approved",
      rationale: "Operationalization gate approved.",
    });
    expect(await advancePhase(db, pm, { projectId: project.id })).toEqual({
      ok: false,
      reason: "already_final",
    });

    // The conditional gate spawned a tracked corrective action.
    const gate2 = await gateForPhase(project.id, 2);
    const cas = await db
      .select()
      .from(correctiveActions)
      .where(eq(correctiveActions.gateId, gate2.id));
    expect(cas).toHaveLength(1);
    expect(cas[0].status).toBe("open");
  });
});

describe("closeCorrectiveAction", () => {
  it("closes (status=closed, closedAt set) and audits; unauthorized role blocked", async () => {
    const project = await createProject(db, pm, { name: "CA Close" });
    const gate = await gateForPhase(project.id, 1);
    await decideGate(db, gl, {
      gateId: gate.id,
      decision: "conditionally_approved",
      rationale: "Conditional.",
      correctiveActions: [{ description: "Fix the thing", dueDate: new Date() }],
    });
    const [ca] = await db
      .select()
      .from(correctiveActions)
      .where(eq(correctiveActions.gateId, gate.id));

    await expect(
      closeCorrectiveAction(db, mle, { correctiveActionId: ca.id }),
    ).rejects.toThrow(/forbidden/);

    const closed = await closeCorrectiveAction(db, pm, {
      correctiveActionId: ca.id,
    });
    expect(closed.status).toBe("closed");
    expect(closed.closedAt).toBeInstanceOf(Date);

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, ca.id));
    expect(entries.some((e) => e.action === "corrective_action.close")).toBe(
      true,
    );
  });
});
