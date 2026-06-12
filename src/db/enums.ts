import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "governance_lead",
  "executive_sponsor",
  "program_manager",
  "ml_engineer",
  "risk_officer",
  "auditor",
]);

export const criticality = pgEnum("criticality", [
  "low",
  "medium",
  "high",
  "mission_critical",
]);

export const projectStatus = pgEnum("project_status", ["active", "archived"]);

export const phaseStatus = pgEnum("phase_status", [
  "not_started",
  "in_progress",
  "awaiting_gate",
  "complete",
]);

// Tri-state per the playbook (Appendix B). NULL decision = gate not yet reviewed.
export const gateDecision = pgEnum("gate_decision", [
  "approved",
  "conditionally_approved",
  "not_approved",
]);

export const correctiveActionStatus = pgEnum("corrective_action_status", [
  "open",
  "closed",
]);

// The playbook's 7-domain risk taxonomy (§3.12)
export const riskDomain = pgEnum("risk_domain", [
  "technical",
  "ethical",
  "operational",
  "cybersecurity",
  "privacy",
  "regulatory",
  "mission_driven",
]);

// 3x3 matrix — BOTH likelihood and impact use this scale
export const ratingLevel = pgEnum("rating_level", ["low", "moderate", "high"]);

export const riskStatus = pgEnum("risk_status", [
  "open",
  "mitigated",
  "accepted",
  "closed",
]);

export const controlFramework = pgEnum("control_framework", [
  "iso_42001",
  "nist_800_53",
]);

export const soaApplicability = pgEnum("soa_applicability", [
  "applicable",
  "not_applicable",
]);

export const soaImplementationStatus = pgEnum("soa_implementation_status", [
  "not_implemented",
  "partially_implemented",
  "implemented",
  "inherited",
]);

export const evidenceLinkTarget = pgEnum("evidence_link_target", [
  "control", // -> soa_entries.id (project-scoped control posture)
  "gate", // -> gates.id
  "risk", // -> risks.id
]);
