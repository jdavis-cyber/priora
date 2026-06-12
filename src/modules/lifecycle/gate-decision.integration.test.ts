// FR-06 — gate sign-off: authorized roles only; tri-state decision recorded with
// rationale/actor/timestamp; conditionally_approved REQUIRES corrective actions
// in the same submission (playbook: conditions must be tracked, never implied).
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  auditLog,
  correctiveActions,
  gates,
  phases,
  users,
} from "@/db/schema";
import type { Actor } from "./service";
import { createProject, decideGate } from "./service";

let gl: Actor;
let pm: Actor;

async function makeUser(role: "governance_lead" | "program_manager") {
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
});

describe("decideGate (FR-06)", () => {
  it("records approved with rationale, decidedBy, decidedAt; audits gate.decide", async () => {
    const project = await createProject(db, pm, { name: "Gate Approve" });
    const gate = await gateForPhase(project.id, 1);

    const decided = await decideGate(db, gl, {
      gateId: gate.id,
      decision: "approved",
      rationale: "Phase I artifacts complete; mission alignment confirmed.",
    });

    expect(decided.decision).toBe("approved");
    expect(decided.rationale).toMatch(/mission alignment/);
    expect(decided.decidedById).toBe(gl.id);
    expect(decided.decidedAt).toBeInstanceOf(Date);

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, gate.id));
    expect(
      entries.some(
        (e) => e.action === "gate.decide" && e.entityType === "gate",
      ),
    ).toBe(true);
  });

  it("conditionally_approved with corrective actions creates corrective_actions rows (open, due-dated)", async () => {
    const project = await createProject(db, pm, { name: "Gate Conditional" });
    const gate = await gateForPhase(project.id, 1);
    const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await decideGate(db, gl, {
      gateId: gate.id,
      decision: "conditionally_approved",
      rationale: "Data lineage doc incomplete — approve with conditions.",
      correctiveActions: [
        { description: "Complete data lineage documentation", dueDate: due },
        { description: "Obtain data steward sign-off", dueDate: due },
      ],
    });

    const cas = await db
      .select()
      .from(correctiveActions)
      .where(eq(correctiveActions.gateId, gate.id));
    expect(cas).toHaveLength(2);
    expect(cas.every((ca) => ca.status === "open")).toBe(true);
    expect(cas.every((ca) => ca.closedAt === null)).toBe(true);
  });

  it("REJECTS conditionally_approved without at least one corrective action (validation error)", async () => {
    const project = await createProject(db, pm, { name: "Gate Cond Invalid" });
    const gate = await gateForPhase(project.id, 1);

    await expect(
      decideGate(db, gl, {
        gateId: gate.id,
        decision: "conditionally_approved",
        rationale: "Conditions exist but none listed.",
      }),
    ).rejects.toThrow();

    const [unchanged] = await db
      .select()
      .from(gates)
      .where(eq(gates.id, gate.id));
    expect(unchanged.decision).toBeNull();
  });

  it("records not_approved without creating corrective actions", async () => {
    const project = await createProject(db, pm, { name: "Gate Reject" });
    const gate = await gateForPhase(project.id, 1);

    const decided = await decideGate(db, gl, {
      gateId: gate.id,
      decision: "not_approved",
      rationale: "Business case does not justify model development.",
    });
    expect(decided.decision).toBe("not_approved");

    const cas = await db
      .select()
      .from(correctiveActions)
      .where(eq(correctiveActions.gateId, gate.id));
    expect(cas).toHaveLength(0);
  });

  it("rejects unauthorized deciders — program_manager cannot decide a gate", async () => {
    const project = await createProject(db, pm, { name: "Gate Unauthorized" });
    const gate = await gateForPhase(project.id, 1);

    await expect(
      decideGate(db, pm, {
        gateId: gate.id,
        decision: "approved",
        rationale: "PM trying to self-approve.",
      }),
    ).rejects.toThrow(/forbidden/);
  });

  it("rejects empty rationale", async () => {
    const project = await createProject(db, pm, { name: "Gate No Rationale" });
    const gate = await gateForPhase(project.id, 1);

    await expect(
      decideGate(db, gl, {
        gateId: gate.id,
        decision: "approved",
        rationale: "",
      }),
    ).rejects.toThrow();
  });
});
