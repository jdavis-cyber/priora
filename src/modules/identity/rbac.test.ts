// RBAC matrix per domain contract §3 — aligned to the playbook's RACI (Appendix A).
// Reads are role-unrestricted in v1; can() governs MUTATING actions only.
import { describe, expect, it } from "vitest";
import {
  ALL_ACTIONS,
  ROLE_LABELS,
  can,
  roleLabel,
  type Action,
  type Role,
} from "./rbac";

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

describe("roleLabel(role)", () => {
  const ROLES: Role[] = [
    "governance_lead",
    "executive_sponsor",
    "program_manager",
    "ml_engineer",
    "risk_officer",
    "auditor",
  ];

  it("renders Title Case with spaces, never the raw enum", () => {
    expect(roleLabel("governance_lead")).toBe("Governance Lead");
    expect(roleLabel("executive_sponsor")).toBe("Executive Sponsor");
    expect(roleLabel("risk_officer")).toBe("Risk Officer");
  });

  it("keeps the ML acronym uppercase (not naive title-casing)", () => {
    expect(roleLabel("ml_engineer")).toBe("ML Engineer");
  });

  it("has a label for every role, none containing an underscore", () => {
    for (const role of ROLES) {
      expect(ROLE_LABELS[role], role).toBeTruthy();
      expect(roleLabel(role)).not.toContain("_");
    }
  });
});
