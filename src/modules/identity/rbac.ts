// RBAC matrix — domain contract §3, derived from the playbook's RACI (Appendix A).
// can() governs MUTATING actions only; reads are role-unrestricted in v1
// (every authenticated role sees everything; the auditor role exists to see).

export type Action =
  | "project.create"
  | "project.edit"
  | "project.archive"
  | "phase.advance"
  | "gate.decide"
  | "risk.create"
  | "risk.edit"
  | "risk.accept"
  | "soa.edit"
  | "evidence.ingest"
  | "evidence.verify"
  | "aep.generate"
  | "user.manage";

export type Role =
  | "governance_lead"
  | "executive_sponsor"
  | "program_manager"
  | "ml_engineer"
  | "risk_officer"
  | "auditor";

export const ALL_ACTIONS: readonly Action[] = [
  "project.create",
  "project.edit",
  "project.archive",
  "phase.advance",
  "gate.decide",
  "risk.create",
  "risk.edit",
  "risk.accept",
  "soa.edit",
  "evidence.ingest",
  "evidence.verify",
  "aep.generate",
  "user.manage",
] as const;

const MATRIX: Record<Role, readonly Action[]> = {
  governance_lead: ALL_ACTIONS,
  executive_sponsor: ["gate.decide", "risk.accept"],
  program_manager: [
    "project.create",
    "project.edit",
    "phase.advance",
    "risk.create",
    "risk.edit",
    "soa.edit",
    "evidence.ingest",
    "aep.generate",
  ],
  ml_engineer: ["evidence.ingest", "evidence.verify"],
  risk_officer: ["risk.create", "risk.edit", "risk.accept"],
  auditor: [],
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[role].includes(action);
}
