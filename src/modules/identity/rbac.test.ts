// RBAC matrix per domain contract §3 — aligned to the playbook's RACI (Appendix A).
// Reads are role-unrestricted in v1; can() governs MUTATING actions only.
import { describe, expect, it } from "vitest";
import { ALL_ACTIONS, can, type Action, type Role } from "./rbac";

const expectExactly = (role: Role, allowed: Action[]) => {
  for (const action of ALL_ACTIONS) {
    expect(can(role, action), `${role} -> ${action}`).toBe(
      allowed.includes(action),
    );
  }
};

describe("can(role, action)", () => {
  it("governance_lead can perform every action", () => {
    expectExactly("governance_lead", [...ALL_ACTIONS]);
  });

  it("executive_sponsor signs gates and accepts risk, nothing else", () => {
    expectExactly("executive_sponsor", ["gate.decide", "risk.accept"]);
  });

  it("program_manager runs delivery but cannot decide gates or manage users", () => {
    expectExactly("program_manager", [
      "project.create",
      "project.edit",
      "phase.advance",
      "risk.create",
      "risk.edit",
      "soa.edit",
      "evidence.ingest",
      "aep.generate",
    ]);
  });

  it("ml_engineer handles evidence only", () => {
    expectExactly("ml_engineer", ["evidence.ingest", "evidence.verify"]);
  });

  it("risk_officer manages and accepts risk", () => {
    expectExactly("risk_officer", ["risk.create", "risk.edit", "risk.accept"]);
  });

  it("auditor is read-only — blocked from every mutating action", () => {
    expectExactly("auditor", []);
  });
});
