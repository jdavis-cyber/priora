export type ArtifactType = {
  readonly id: string;
  readonly label: string;
  readonly typicalPhase: number | null; // CPMAI 1..6 default suggestion, or null = any
};

// Representative subset of the playbook's Appendix D catalog (29 entries).
// typicalPhase is a UI default (preselects the phase dropdown), never a
// constraint — evidence can attach to any phase.
export const ARTIFACT_TYPES = [
  { id: "ai_governance_scope_statement", label: "AI Governance Scope Statement", typicalPhase: 1 },
  { id: "mission_risk_profile", label: "Mission Risk Profile (MRP)", typicalPhase: 1 },
  { id: "statement_of_applicability", label: "Statement of Applicability (SoA)", typicalPhase: 1 },
  { id: "stakeholder_register", label: "Stakeholder Register", typicalPhase: 1 },
  { id: "threat_model", label: "Threat Model", typicalPhase: 1 },
  { id: "data_inventory", label: "Data Inventory", typicalPhase: 2 },
  { id: "data_lineage_record", label: "Data Lineage Record", typicalPhase: 2 },
  { id: "privacy_impact_assessment", label: "Privacy Impact Assessment", typicalPhase: 2 },
  { id: "model_card", label: "Model Card", typicalPhase: 4 },
  { id: "model_training_log", label: "Model Training Log", typicalPhase: 4 },
  { id: "evaluation_report", label: "Evaluation Report", typicalPhase: 5 },
  { id: "bias_evaluation_report", label: "Bias Evaluation Report", typicalPhase: 5 },
  { id: "go_no_go_decision_record", label: "Go/No-Go Decision Record", typicalPhase: 5 },
  { id: "deployment_readiness_checklist", label: "Deployment Readiness Checklist", typicalPhase: 6 },
  { id: "cyber_resilience_posture_report", label: "Cyber Resilience Posture Report (CRPR)", typicalPhase: 6 },
  { id: "automated_control_validation_ruleset", label: "Automated Control Validation Ruleset (ACVR)", typicalPhase: 6 },
  { id: "telemetry_configuration_specification", label: "Telemetry Configuration Specification", typicalPhase: 6 },
  { id: "ai_system_runbook", label: "AI System Runbook", typicalPhase: 6 },
  { id: "monitoring_drift_management_plan", label: "Monitoring & Drift Management Plan", typicalPhase: 6 },
  { id: "incident_response_plan", label: "Incident Response Plan", typicalPhase: 6 },
  { id: "post_deployment_review_report", label: "Post-Deployment Review Report", typicalPhase: 6 },
  { id: "risk_acceptance_record", label: "Risk Acceptance Record", typicalPhase: null },
  { id: "material_change_evaluation", label: "Material Change Evaluation (MCE)", typicalPhase: null },
  { id: "management_review_record", label: "Management Review Record", typicalPhase: null },
  { id: "gate_review_record", label: "Gate Review Record", typicalPhase: null },
  { id: "training_log", label: "Training Log", typicalPhase: null },
  { id: "lessons_learned_record", label: "Lessons Learned Record", typicalPhase: null },
  { id: "meeting_minutes", label: "Meeting Minutes", typicalPhase: null },
  { id: "other", label: "Other", typicalPhase: null },
] as const satisfies readonly ArtifactType[];

export type ArtifactTypeId = (typeof ARTIFACT_TYPES)[number]["id"];

export function isArtifactTypeId(id: string): id is ArtifactTypeId {
  return ARTIFACT_TYPES.some((t) => t.id === id);
}
