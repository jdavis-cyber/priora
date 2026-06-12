// FR-05 / FR-06 — lifecycle progression rules (legacy MTP cases TC-005…TC-009).
// WHY these tests exist: the playbook's core governance guarantee is that no AI
// project reaches Operationalization without a decided, non-blocking gate at every
// phase, signed off by an authorized governance function. If these rules loosen,
// the product stops being a governance tool.
import { describe, expect, it } from "vitest";
import type { Role } from "../identity/rbac";
import { canDecideGate, evaluateAdvance } from "./rules";

const ALL_ROLES: Role[] = [
  "governance_lead",
  "executive_sponsor",
  "program_manager",
  "ml_engineer",
  "risk_officer",
  "auditor",
];
const ADVANCE_ROLES: Role[] = ["governance_lead", "program_manager"];
const NON_ADVANCE_ROLES: Role[] = ALL_ROLES.filter(
  (r) => !ADVANCE_ROLES.includes(r),
);
const approved = { decision: "approved" as const };
const conditional = { decision: "conditionally_approved" as const };
const notApproved = { decision: "not_approved" as const };
const undecided = { decision: null };

describe("evaluateAdvance — strict linear progression (FR-05 / TC-005)", () => {
  it("advances exactly one phase at a time, 1→2 through 5→6 — no skipping", () => {
    for (const phase of [1, 2, 3, 4, 5]) {
      const result = evaluateAdvance(phase, approved, "governance_lead");
      expect(result).toEqual({ ok: true, nextPhase: phase + 1 });
    }
  });

  it("phase 6 (Operationalization) is final — advance blocked even with an approved gate", () => {
    expect(evaluateAdvance(6, approved, "governance_lead")).toEqual({
      ok: false,
      reason: "already_final",
    });
    expect(evaluateAdvance(6, conditional, "governance_lead")).toEqual({
      ok: false,
      reason: "already_final",
    });
  });
});

describe("evaluateAdvance — gate must be decided (FR-06 / TC-006)", () => {
  it("blocks with gate_not_decided when the gate has no decision yet (NULL)", () => {
    for (const phase of [1, 2, 3, 4, 5]) {
      expect(evaluateAdvance(phase, undecided, "governance_lead")).toEqual({
        ok: false,
        reason: "gate_not_decided",
      });
    }
  });
});

describe("evaluateAdvance — tri-state decision semantics (FR-06 / TC-007, TC-008)", () => {
  it("approved advances (TC-007)", () => {
    expect(evaluateAdvance(3, approved, "program_manager")).toEqual({
      ok: true,
      nextPhase: 4,
    });
  });

  it("conditionally_approved advances — corrective actions are tracked separately (TC-007)", () => {
    expect(evaluateAdvance(3, conditional, "program_manager")).toEqual({
      ok: true,
      nextPhase: 4,
    });
  });

  it("not_approved blocks with gate_not_approved (TC-008)", () => {
    for (const phase of [1, 2, 3, 4, 5]) {
      expect(evaluateAdvance(phase, notApproved, "governance_lead")).toEqual({
        ok: false,
        reason: "gate_not_approved",
      });
    }
  });
});

describe("evaluateAdvance — authorization (FR-06 / TC-009)", () => {
  it("roles with phase.advance permission may advance", () => {
    for (const role of ADVANCE_ROLES) {
      expect(evaluateAdvance(1, approved, role)).toEqual({
        ok: true,
        nextPhase: 2,
      });
    }
  });

  it("roles without phase.advance are blocked with not_authorized", () => {
    for (const role of NON_ADVANCE_ROLES) {
      expect(evaluateAdvance(1, approved, role)).toEqual({
        ok: false,
        reason: "not_authorized",
      });
    }
  });

  it("not_authorized takes precedence over every other failure reason", () => {
    expect(evaluateAdvance(6, approved, "auditor")).toEqual({
      ok: false,
      reason: "not_authorized",
    });
    expect(evaluateAdvance(2, undecided, "ml_engineer")).toEqual({
      ok: false,
      reason: "not_authorized",
    });
    expect(evaluateAdvance(2, notApproved, "risk_officer")).toEqual({
      ok: false,
      reason: "not_authorized",
    });
  });

  it("already_final takes precedence over gate state for authorized roles", () => {
    expect(evaluateAdvance(6, undecided, "governance_lead")).toEqual({
      ok: false,
      reason: "already_final",
    });
    expect(evaluateAdvance(6, notApproved, "governance_lead")).toEqual({
      ok: false,
      reason: "already_final",
    });
  });
});

describe("canDecideGate — gate sign-off restricted (FR-06 / TC-009)", () => {
  it("governance_lead and executive_sponsor may decide gates", () => {
    expect(canDecideGate("governance_lead")).toBe(true);
    expect(canDecideGate("executive_sponsor")).toBe(true);
  });

  it("no other role may decide gates", () => {
    for (const role of [
      "program_manager",
      "ml_engineer",
      "risk_officer",
      "auditor",
    ] as Role[]) {
      expect(canDecideGate(role)).toBe(false);
    }
  });
});
