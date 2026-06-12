// seed/demo-data.ts — the full demo narrative as data. ALL CONTENT FICTIONAL.
// Buckets per project partition the 63-control library exactly (asserted in demo.ts).

export const DEMO_PASSWORD = "demo-priora-2026";
export const DEMO_SEED_VERSION = "1";

export const DEMO_USERS = [
  { email: "avery.cole@priora.demo", name: "Avery Cole", role: "governance_lead" },
  { email: "morgan.reyes@priora.demo", name: "Morgan Reyes", role: "executive_sponsor" },
  { email: "priya.natarajan@priora.demo", name: "Priya Natarajan", role: "program_manager" },
  { email: "felix.okafor@priora.demo", name: "Felix Okafor", role: "ml_engineer" },
  { email: "dana.whitfield@priora.demo", name: "Dana Whitfield", role: "risk_officer" },
  { email: "sam.aldous@priora.demo", name: "Sam Aldous", role: "auditor" },
] as const;

// ---------------------------------------------------------------------------
// The 63-control library refs (M3 seed/controls.ts). demo.ts asserts this list
// matches the DB exactly before posturing any SoA.
// ---------------------------------------------------------------------------
export const ISO_REFS = [
  "A.2.2", "A.2.3", "A.2.4",
  "A.3.2", "A.3.3",
  "A.4.2", "A.4.3", "A.4.4", "A.4.5", "A.4.6",
  "A.5.2", "A.5.3", "A.5.4", "A.5.5",
  "A.6.1.2", "A.6.1.3", "A.6.2.2", "A.6.2.3", "A.6.2.4", "A.6.2.5", "A.6.2.6", "A.6.2.7", "A.6.2.8",
  "A.7.2", "A.7.3", "A.7.4", "A.7.5", "A.7.6",
  "A.8.2", "A.8.3", "A.8.4", "A.8.5",
  "A.9.2", "A.9.3", "A.9.4",
  "A.10.2", "A.10.3", "A.10.4",
] as const;

export const NIST_REFS = [
  "AC-2", "AC-3", "AC-6",
  "AT-2", "AT-3",
  "AU-2", "AU-6", "AU-9",
  "CA-7", "CM-3", "CM-4",
  "IR-4", "IR-6",
  "MP-6", "PL-8", "PM-31", "PS-3",
  "RA-3", "RA-5",
  "SA-11", "SC-8", "SC-28",
  "SI-4", "SI-7", "SI-10",
] as const;

export const ALL_REFS: readonly string[] = [...ISO_REFS, ...NIST_REFS]; // 63

export type SoaPlan = {
  implemented: readonly string[];
  partially_implemented: readonly string[];
  inherited: readonly string[];
  not_applicable: ReadonlyArray<{ ref: string; justification: string }>;
  not_implemented: readonly string[];
};

// ---------------------------------------------------------------------------
// Project 1 — SENTINEL. NLP triage assistant routing inbound support messages
// by urgency. Phase V (Model Evaluation), awaiting the Go/No-Go gate decision.
// Gates 1-4 decided (gate 3 conditionally approved, corrective action CLOSED).
// SoA ~80% (50/63 addressed = 79%).
// ---------------------------------------------------------------------------
export const SENTINEL_SOA: SoaPlan = {
  implemented: [
    "A.2.2", "A.2.3", "A.2.4", "A.3.2", "A.3.3", "A.4.2", "A.4.3", "A.4.4",
    "A.5.2", "A.5.3", "A.5.4", "A.6.1.2", "A.6.1.3", "A.6.2.2", "A.6.2.3",
    "A.6.2.4", "A.7.2", "A.7.3", "A.7.4", "A.8.2", "A.9.2", "A.9.3",
    "AC-2", "AC-3", "AC-6", "AU-2", "AU-6", "AU-9", "RA-3", "PL-8",
  ], // 30
  partially_implemented: [
    "A.4.5", "A.4.6", "A.5.5", "A.6.2.5", "A.6.2.6", "A.7.5", "A.8.3", "A.9.4",
    "CA-7", "RA-5", "SI-4", "SA-11", "SI-7", "SI-10",
  ], // 14
  inherited: ["SC-8", "SC-28", "PS-3"], // 3 — platform/network baseline of the hosting environment
  not_applicable: [
    { ref: "MP-6", justification: "Training corpus and model artifacts exist only in managed cloud object storage; no removable media is used at any lifecycle stage." },
    { ref: "A.10.3", justification: "Sentinel is developed fully in-house; no third-party supplier provides AI components or training data services in v1." },
    { ref: "A.10.4", justification: "The triage model is not redistributed to customers or downstream parties; it serves internal queue routing only." },
  ], // 3
  not_implemented: [
    "A.6.2.7", "A.6.2.8", "A.7.6", "A.8.4", "A.8.5", "A.10.2",
    "CM-3", "CM-4", "IR-4", "IR-6", "AT-2", "AT-3", "PM-31",
  ], // 13
}; // 30+14+3+3+13 = 63; addressed 50/63 = 79%

// ---------------------------------------------------------------------------
// Project 2 — CARTOGRAPHER. Computer-vision data project building a curated,
// labeled imagery corpus for infrastructure-condition models. Phase II (Data
// Understanding). Gate 1 approved. SoA partially triaged (20/63 = 32%).
// ---------------------------------------------------------------------------
export const CARTOGRAPHER_SOA: SoaPlan = {
  implemented: ["A.2.2", "A.2.3", "A.3.2", "A.4.2", "A.5.2", "A.6.1.2", "AC-2", "AU-2"], // 8
  partially_implemented: [
    "A.2.4", "A.3.3", "A.4.3", "A.5.3", "A.6.2.2", "A.7.2", "A.7.3",
    "RA-3", "PL-8", "AT-2",
  ], // 10
  inherited: [], // 0
  not_applicable: [
    { ref: "MP-6", justification: "Imagery corpus lives exclusively in cloud object storage with lifecycle policies; no removable media in the pipeline." },
    { ref: "PS-3", justification: "Annotation staff are screened under the parent organization's existing personnel security program; screening evidence is tracked there, not duplicated per project." },
  ], // 2
  not_implemented: [
    "A.4.4", "A.4.5", "A.4.6", "A.5.4", "A.5.5", "A.6.1.3", "A.6.2.3", "A.6.2.4",
    "A.6.2.5", "A.6.2.6", "A.6.2.7", "A.6.2.8", "A.7.4", "A.7.5", "A.7.6",
    "A.8.2", "A.8.3", "A.8.4", "A.8.5", "A.9.2", "A.9.3", "A.9.4",
    "A.10.2", "A.10.3", "A.10.4",
    "AC-3", "AC-6", "AU-6", "AU-9", "CA-7", "PM-31", "RA-5", "SI-4",
    "CM-3", "CM-4", "IR-4", "IR-6", "SA-11", "SC-8", "SC-28", "SI-7", "SI-10", "AT-3",
  ], // 43
}; // 8+10+0+2+43 = 63; addressed 20/63 = 32%

// ---------------------------------------------------------------------------
// Project 3 — LEDGER. Enterprise-CRM ML scoring initiative ranking renewal
// opportunities. Phase VI (Operationalization), operational. All gates
// approved. SoA complete (63/63 = 100%). Risks mostly mitigated; one accepted
// with a recorded risk acceptance.
// ---------------------------------------------------------------------------
export const LEDGER_SOA: SoaPlan = {
  implemented: [
    "A.2.2", "A.2.3", "A.2.4", "A.3.2", "A.3.3",
    "A.4.2", "A.4.3", "A.4.4", "A.4.5", "A.4.6",
    "A.5.2", "A.5.3", "A.5.4", "A.5.5",
    "A.6.1.2", "A.6.1.3", "A.6.2.2", "A.6.2.3", "A.6.2.4", "A.6.2.5", "A.6.2.6", "A.6.2.7", "A.6.2.8",
    "A.7.2", "A.7.3", "A.7.4", "A.7.5", "A.7.6",
    "A.8.2", "A.8.3", "A.8.4", "A.8.5",
    "A.9.2", "A.9.3", "A.9.4",
    "A.10.2", "A.10.3",
    "AC-6", "AT-2", "AU-2", "AU-6", "CA-7", "CM-3", "CM-4", "IR-4", "IR-6",
    "PL-8", "PM-31", "PS-3", "RA-3", "RA-5", "SA-11", "SI-4", "SI-7", "SI-10",
  ], // 55
  inherited: ["AC-2", "AC-3", "AU-9", "SC-8", "SC-28"], // 5 — enterprise CRM platform baseline
  partially_implemented: [], // 0
  not_applicable: [
    { ref: "MP-6", justification: "All data resides in the CRM platform and managed warehouses; no removable media exists in the scoring pipeline." },
    { ref: "A.10.4", justification: "Scores are consumed only inside the organization's own CRM; the model is not provided to external parties." },
    { ref: "AT-3", justification: "No project-specific privileged roles beyond the platform team; role-based training is covered by the enterprise program and evidenced at the organization level." },
  ], // 3
  not_implemented: [], // 0
}; // 55+5+0+3+0 = 63; addressed 63/63 = 100%

// ---------------------------------------------------------------------------
// Risks. likelihood/impact on the 3x3 (low|moderate|high). Owners by role.
// ---------------------------------------------------------------------------
export type DemoRisk = {
  title: string;
  description: string;
  domain: "technical" | "ethical" | "operational" | "cybersecurity" | "privacy" | "regulatory" | "mission_driven";
  likelihood: "low" | "moderate" | "high";
  impact: "low" | "moderate" | "high";
  status: "open" | "mitigated" | "accepted" | "closed";
  treatment: string;
  ownerEmail: string;
};

export const SENTINEL_RISKS: DemoRisk[] = [
  {
    title: "Urgent messages misclassified as routine",
    description: "False-negative urgency classification delays response to genuinely critical inbound messages.",
    domain: "technical", likelihood: "moderate", impact: "high", status: "open",
    treatment: "Recall-weighted evaluation threshold plus human review queue for low-confidence predictions.",
    ownerEmail: "felix.okafor@priora.demo",
  },
  {
    title: "Demographic bias in triage prioritization",
    description: "Message phrasing patterns correlated with demographic groups could skew urgency scores.",
    domain: "ethical", likelihood: "moderate", impact: "high", status: "open",
    treatment: "Bias evaluation report across dialect/region cohorts gates the Phase V Go/No-Go decision.",
    ownerEmail: "dana.whitfield@priora.demo",
  },
  {
    title: "Analyst over-reliance on model suggestions",
    description: "Queue analysts may stop independently scanning for urgency once model labels appear.",
    domain: "operational", likelihood: "moderate", impact: "moderate", status: "open",
    treatment: "UI presents the model label as advisory; periodic blind-queue calibration audits.",
    ownerEmail: "priya.natarajan@priora.demo",
  },
  {
    title: "Prompt injection via inbound message content",
    description: "Adversarial text inside customer messages could manipulate the triage model's instructions or downstream tooling.",
    domain: "cybersecurity", likelihood: "moderate", impact: "high", status: "open",
    treatment: "Input sanitization layer; model isolated from tool execution; SI-10 input-validation control linked.",
    ownerEmail: "dana.whitfield@priora.demo",
  },
  {
    title: "PII retained in training snapshots",
    description: "Early corpus snapshots contained unredacted contact details inside message bodies.",
    domain: "privacy", likelihood: "moderate", impact: "moderate", status: "mitigated",
    treatment: "Redaction pipeline added in Phase III; snapshots regenerated; PIA updated. Mitigation evidenced.",
    ownerEmail: "dana.whitfield@priora.demo",
  },
  {
    title: "Message retention schedule conflict",
    description: "Triage-corpus retention may exceed the organization's records schedule for customer communications.",
    domain: "regulatory", likelihood: "low", impact: "moderate", status: "open",
    treatment: "Records office review of corpus retention; align snapshot TTLs before operationalization.",
    ownerEmail: "priya.natarajan@priora.demo",
  },
  {
    title: "Triage backlog if model is disabled",
    description: "Operations now plans staffing around model throughput; a model outage recreates manual backlog at higher volume.",
    domain: "mission_driven", likelihood: "moderate", impact: "high", status: "open",
    treatment: "Documented manual-triage fallback runbook and surge-staffing trigger in the operational readiness plan.",
    ownerEmail: "priya.natarajan@priora.demo",
  },
  {
    title: "Embedding drift after product-vocabulary changes",
    description: "New product names and seasonal phrasing degrade embedding quality between retraining cycles.",
    domain: "technical", likelihood: "moderate", impact: "moderate", status: "open",
    treatment: "Drift monitoring plan with vocabulary-shift alerts; scheduled quarterly re-embedding.",
    ownerEmail: "felix.okafor@priora.demo",
  },
]; // 8 risks, all 7 domains covered

export const CARTOGRAPHER_RISKS: DemoRisk[] = [
  {
    title: "Label noise in the annotation pipeline",
    description: "Inter-annotator agreement on infrastructure-condition classes is below the target threshold.",
    domain: "technical", likelihood: "high", impact: "moderate", status: "open",
    treatment: "Tighten the labeling guide; double-annotate a 10% audit sample per batch.",
    ownerEmail: "felix.okafor@priora.demo",
  },
  {
    title: "Annotation throughput below corpus plan",
    description: "Current annotation capacity will not meet the Phase III data preparation entry criteria date.",
    domain: "operational", likelihood: "moderate", impact: "moderate", status: "open",
    treatment: "Re-baseline the corpus plan or add a second annotation cell; decision due at gate 2.",
    ownerEmail: "priya.natarajan@priora.demo",
  },
  {
    title: "Identifiable people in collected imagery",
    description: "Street-level imagery batches include faces and license plates not relevant to infrastructure condition.",
    domain: "privacy", likelihood: "high", impact: "high", status: "open",
    treatment: "Automated blurring at ingest; PIA before any Phase III preparation work on affected batches.",
    ownerEmail: "dana.whitfield@priora.demo",
  },
  {
    title: "Dataset poisoning via public imagery sources",
    description: "Publicly sourced imagery could be deliberately seeded with mislabeled or adversarial content.",
    domain: "cybersecurity", likelihood: "moderate", impact: "high", status: "open",
    treatment: "Source allowlist, provenance logging per batch, and statistical outlier screening at ingest.",
    ownerEmail: "dana.whitfield@priora.demo",
  },
  {
    title: "Imagery licensing terms unresolved",
    description: "Two candidate imagery sources carry license terms that may prohibit model-training use.",
    domain: "regulatory", likelihood: "moderate", impact: "moderate", status: "open",
    treatment: "Legal review of source licenses before those batches enter the training corpus.",
    ownerEmail: "priya.natarajan@priora.demo",
  },
]; // 5 risks, all open

export const LEDGER_RISKS: DemoRisk[] = [
  {
    title: "Score instability on sparse accounts",
    description: "Accounts with thin interaction history produced volatile renewal scores between runs.",
    domain: "technical", likelihood: "moderate", impact: "moderate", status: "mitigated",
    treatment: "Minimum-history threshold added; sparse accounts fall back to segment-average scoring.",
    ownerEmail: "felix.okafor@priora.demo",
  },
  {
    title: "Disparate scoring across customer regions",
    description: "Phase V evaluation found region-correlated score gaps not explained by renewal behavior.",
    domain: "ethical", likelihood: "moderate", impact: "high", status: "mitigated",
    treatment: "Region feature removed; post-mitigation parity evaluation documented in the evaluation report.",
    ownerEmail: "dana.whitfield@priora.demo",
  },
  {
    title: "Stale CRM fields degrade scores",
    description: "Score quality depends on CRM hygiene; stale account fields propagate into rankings.",
    domain: "operational", likelihood: "moderate", impact: "moderate", status: "mitigated",
    treatment: "Field-freshness checks in the feature pipeline; stale-field accounts flagged in the score UI.",
    ownerEmail: "priya.natarajan@priora.demo",
  },
  {
    title: "Bulk score exfiltration via reporting API",
    description: "Unrestricted report exports could expose the full scored book of business.",
    domain: "cybersecurity", likelihood: "low", impact: "high", status: "mitigated",
    treatment: "Export rate limits and row caps; AU-6 review of export audit events.",
    ownerEmail: "dana.whitfield@priora.demo",
  },
  {
    title: "Score-plus-notes re-identification",
    description: "Combining renewal scores with free-text account notes could reveal sensitive customer circumstances.",
    domain: "privacy", likelihood: "low", impact: "moderate", status: "mitigated",
    treatment: "Notes excluded from the scoring feature set; access to combined views restricted by role.",
    ownerEmail: "dana.whitfield@priora.demo",
  },
  {
    title: "Legacy model version lacks per-feature explainability",
    description: "The v1 scoring model in production cannot produce per-feature attributions; full explainability arrives with the v2 model next cycle.",
    domain: "regulatory", likelihood: "low", impact: "moderate", status: "accepted",
    treatment: "Residual risk accepted by the Executive Sponsor until the v2 model ships; global feature importances published in the model card meanwhile.",
    ownerEmail: "dana.whitfield@priora.demo",
  },
]; // 6 risks: 5 mitigated, 1 accepted (risk_acceptances row in demo.ts)

export const LEDGER_RISK_ACCEPTANCE = {
  riskTitle: "Legacy model version lacks per-feature explainability",
  rationale:
    "Per-feature attributions are not achievable on the deployed v1 model architecture. Global feature importances are published, scores are advisory to human account owners, and the v2 model (with per-feature explainability) is scheduled next cycle. Residual risk accepted until then.",
  acceptedByEmail: "morgan.reyes@priora.demo",
  reviewBy: new Date("2026-12-01T00:00:00Z"),
};

// ---------------------------------------------------------------------------
// Gates. decidedBy is avery.cole (governance_lead) unless noted; dates tell a
// believable timeline. Sentinel gate 5 and Cartographer gates 2-6 stay NULL.
// ---------------------------------------------------------------------------
export type DemoGateDecision = {
  phaseNumber: number;
  decision: "approved" | "conditionally_approved" | "not_approved";
  rationale: string;
  decidedByEmail: string;
  decidedAt: Date;
};

export const SENTINEL_GATES: DemoGateDecision[] = [
  { phaseNumber: 1, decision: "approved", rationale: "Business case, governance scope, and MRP complete; triage problem well-bounded.", decidedByEmail: "avery.cole@priora.demo", decidedAt: new Date("2026-02-06T15:00:00Z") },
  { phaseNumber: 2, decision: "approved", rationale: "Data inventory and PIA accepted; message corpus coverage adequate for the urgency taxonomy.", decidedByEmail: "avery.cole@priora.demo", decidedAt: new Date("2026-03-06T16:00:00Z") },
  { phaseNumber: 3, decision: "conditionally_approved", rationale: "Preparation accepted except duplicate-message contamination in the February snapshot; proceed while the corrective action closes.", decidedByEmail: "avery.cole@priora.demo", decidedAt: new Date("2026-04-03T14:30:00Z") },
  { phaseNumber: 4, decision: "approved", rationale: "Model development complete; model card and training logs evidence the documented configuration.", decidedByEmail: "morgan.reyes@priora.demo", decidedAt: new Date("2026-05-08T17:00:00Z") },
];

export const SENTINEL_CORRECTIVE_ACTION = {
  gatePhaseNumber: 3,
  description:
    "Re-run deduplication on the February message snapshot, document the sampling-bias check, and attach the regenerated data lineage record to gate 3.",
  dueDate: new Date("2026-04-30T00:00:00Z"),
  status: "closed" as const,
  closedAt: new Date("2026-04-21T19:00:00Z"),
};

export const CARTOGRAPHER_GATES: DemoGateDecision[] = [
  { phaseNumber: 1, decision: "approved", rationale: "Corpus business case approved; collection scope limited to infrastructure-relevant imagery.", decidedByEmail: "avery.cole@priora.demo", decidedAt: new Date("2026-05-15T15:00:00Z") },
];

export const LEDGER_GATES: DemoGateDecision[] = [
  { phaseNumber: 1, decision: "approved", rationale: "Scoring initiative scoped to renewal opportunities; governance roles assigned.", decidedByEmail: "avery.cole@priora.demo", decidedAt: new Date("2025-10-10T15:00:00Z") },
  { phaseNumber: 2, decision: "approved", rationale: "CRM data understanding complete; field-quality baseline documented.", decidedByEmail: "avery.cole@priora.demo", decidedAt: new Date("2025-11-07T16:00:00Z") },
  { phaseNumber: 3, decision: "approved", rationale: "Feature pipeline reviewed; notes excluded from features per privacy treatment.", decidedByEmail: "avery.cole@priora.demo", decidedAt: new Date("2025-12-05T15:30:00Z") },
  { phaseNumber: 4, decision: "approved", rationale: "Model development complete; reproducible training configuration evidenced.", decidedByEmail: "avery.cole@priora.demo", decidedAt: new Date("2026-01-09T16:00:00Z") },
  { phaseNumber: 5, decision: "approved", rationale: "Evaluation accepted including post-mitigation regional parity results; Go decision recorded.", decidedByEmail: "morgan.reyes@priora.demo", decidedAt: new Date("2026-02-13T17:00:00Z") },
  { phaseNumber: 6, decision: "approved", rationale: "Operational readiness verified: runbook, drift monitoring, and incident path in place.", decidedByEmail: "morgan.reyes@priora.demo", decidedAt: new Date("2026-03-13T16:00:00Z") },
];

// ---------------------------------------------------------------------------
// Evidence. kind file => bytes flow through storage via ingestEvidence (hashes
// verify). kind json => canonical-JSON hashed payload. Links resolve at seed
// time: control => SoA entry by control ref; gate => by phase number; risk =>
// by risk title.
// ---------------------------------------------------------------------------
export type DemoEvidence = {
  artifactType: string; // ARTIFACT_TYPES id (M4 catalog)
  phaseNumber: number;
  uploadedByEmail: string;
  links: ReadonlyArray<
    | { targetType: "control"; controlRef: string }
    | { targetType: "gate"; phaseNumber: number }
    | { targetType: "risk"; riskTitle: string }
  >;
} & (
  | { kind: "file"; fileName: string; mimeType: string; content: string }
  | { kind: "json"; payload: unknown }
);

export const SENTINEL_EVIDENCE: DemoEvidence[] = [
  {
    artifactType: "ai_governance_scope_statement", phaseNumber: 1, kind: "file",
    fileName: "sentinel-governance-scope.md", mimeType: "text/markdown",
    uploadedByEmail: "priya.natarajan@priora.demo",
    links: [{ targetType: "control", controlRef: "A.2.2" }, { targetType: "gate", phaseNumber: 1 }],
    content: "# Sentinel — AI Governance Scope Statement\n\nSentinel is an NLP triage assistant that scores inbound support messages for urgency and routes them to response queues. In scope: the urgency classifier, its training corpus, and the routing integration. Out of scope: automated replies of any kind. Governance Lead: Avery Cole. Executive Sponsor: Morgan Reyes.\n",
  },
  {
    artifactType: "mission_risk_profile", phaseNumber: 1, kind: "json",
    uploadedByEmail: "dana.whitfield@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 1 }],
    payload: { system: "Sentinel", missionImpact: "high", autonomyLevel: "advisory", dataSensitivity: "moderate", overallTier: "high", rationale: "Mis-triage of urgent messages carries direct customer-harm potential; model output remains advisory to human analysts." },
  },
  {
    artifactType: "statement_of_applicability", phaseNumber: 1, kind: "json",
    uploadedByEmail: "avery.cole@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 1 }],
    payload: { system: "Sentinel", baselineVersion: "demo-1", summary: "Initial SoA triage: 63 library controls cloned; applicability review completed for governance and data-management families; remaining families triaged through Phase IV." },
  },
  {
    artifactType: "stakeholder_register", phaseNumber: 1, kind: "file",
    fileName: "sentinel-stakeholders.md", mimeType: "text/markdown",
    uploadedByEmail: "priya.natarajan@priora.demo",
    links: [],
    content: "# Sentinel — Stakeholder Register\n\n| Role | Name | Interest |\n|---|---|---|\n| Governance Lead | Avery Cole | Gate decisions, SoA |\n| Executive Sponsor | Morgan Reyes | Go/No-Go authority, risk acceptance |\n| Program Manager | Priya Natarajan | Delivery, corrective actions |\n| ML Engineer | Felix Okafor | Model + evaluation evidence |\n| Risk Officer | Dana Whitfield | Risk register, PIA |\n| Support Operations Lead (fictional) | Jordan U. | Queue impact |\n",
  },
  {
    artifactType: "threat_model", phaseNumber: 1, kind: "file",
    fileName: "sentinel-threat-model.md", mimeType: "text/markdown",
    uploadedByEmail: "dana.whitfield@priora.demo",
    links: [{ targetType: "risk", riskTitle: "Prompt injection via inbound message content" }, { targetType: "control", controlRef: "RA-3" }],
    content: "# Sentinel — Threat Model\n\nPrimary surfaces: (1) adversarial text in inbound messages (prompt injection, evasion phrasing); (2) training-corpus poisoning via crafted ticket submissions; (3) model output manipulation of queue routing. Mitigations mapped to SI-10 (input validation), RA-3 (risk assessment), and the advisory-only routing design.\n",
  },
  {
    artifactType: "data_inventory", phaseNumber: 2, kind: "file",
    fileName: "sentinel-data-inventory.md", mimeType: "text/markdown",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 2 }],
    content: "# Sentinel — Data Inventory\n\nSources: support message corpus (rolling 18 months, ~2.1M messages), urgency labels from historical analyst dispositions, queue metadata. All sources internal; no third-party data. Redaction status tracked per snapshot.\n",
  },
  {
    artifactType: "privacy_impact_assessment", phaseNumber: 2, kind: "file",
    fileName: "sentinel-pia.md", mimeType: "text/markdown",
    uploadedByEmail: "dana.whitfield@priora.demo",
    links: [{ targetType: "risk", riskTitle: "PII retained in training snapshots" }, { targetType: "control", controlRef: "A.7.4" }],
    content: "# Sentinel — Privacy Impact Assessment\n\nFinding: pre-March snapshots contained unredacted contact details in message bodies. Disposition: redaction pipeline added at ingest; affected snapshots regenerated and originals destroyed per schedule. Residual exposure assessed as low. Reassess at operationalization.\n",
  },
  {
    artifactType: "data_lineage_record", phaseNumber: 3, kind: "json",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 3 }],
    payload: { snapshot: "2026-04-regenerated", parent: "2026-02-raw", transforms: ["pii_redaction_v2", "dedup_exact", "dedup_near_simhash", "stratified_sample_by_queue"], rowCounts: { input: 2104882, afterDedup: 1987340, sampled: 400000 } },
  },
  {
    artifactType: "gate_review_record", phaseNumber: 3, kind: "json",
    uploadedByEmail: "avery.cole@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 3 }],
    payload: { gate: 3, decision: "conditionally_approved", conditions: ["Close duplicate-contamination corrective action by 2026-04-30"], attendees: ["Avery Cole", "Priya Natarajan", "Felix Okafor", "Dana Whitfield"] },
  },
  {
    artifactType: "model_card", phaseNumber: 4, kind: "file",
    fileName: "sentinel-model-card.md", mimeType: "text/markdown",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 4 }],
    content: "# Sentinel — Model Card\n\nArchitecture: fine-tuned transformer encoder, 4-class urgency head. Training data: 400k stratified messages (2026-04 regenerated snapshot). Intended use: advisory urgency scoring for queue routing. Out-of-scope uses: automated customer responses, personnel evaluation. Known limitations: degraded confidence on messages under 8 tokens and on novel product vocabulary.\n",
  },
  {
    artifactType: "model_training_log", phaseNumber: 4, kind: "file",
    fileName: "sentinel-training-log.txt", mimeType: "text/plain",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [],
    content: "run=sentinel-2026-05-02T0314Z base=encoder-v3 epochs=4 lr=2e-5 seed=42\nval_f1_macro=0.871 val_recall_urgent=0.934\nartifact=registry://sentinel/9f2c (fictional)\n",
  },
  {
    artifactType: "evaluation_report", phaseNumber: 5, kind: "file",
    fileName: "sentinel-evaluation-report.md", mimeType: "text/markdown",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [{ targetType: "control", controlRef: "SA-11" }],
    content: "# Sentinel — Evaluation Report (Phase V)\n\nHeld-out test: macro-F1 0.866; urgent-class recall 0.929 (target >= 0.92). Robustness: 4.1% degradation under paraphrase perturbation (threshold 5%). Open item for Go/No-Go: bias evaluation across dialect cohorts (see Bias Evaluation Report).\n",
  },
  {
    artifactType: "bias_evaluation_report", phaseNumber: 5, kind: "file",
    fileName: "sentinel-bias-evaluation.md", mimeType: "text/markdown",
    uploadedByEmail: "dana.whitfield@priora.demo",
    links: [{ targetType: "risk", riskTitle: "Demographic bias in triage prioritization" }],
    content: "# Sentinel — Bias Evaluation Report\n\nCohorts: regional dialect clusters and non-native phrasing patterns (proxy cohorts; no demographic attributes collected). Result: urgent-class recall spread of 3.8 points across cohorts; largest gap on non-native phrasing. Recommendation: targeted augmentation before Go, or documented compensating human-review rule for the affected cohort.\n",
  },
]; // 13 artifacts (>= 12), every hash real

export const CARTOGRAPHER_EVIDENCE: DemoEvidence[] = [
  {
    artifactType: "ai_governance_scope_statement", phaseNumber: 1, kind: "file",
    fileName: "cartographer-governance-scope.md", mimeType: "text/markdown",
    uploadedByEmail: "priya.natarajan@priora.demo",
    links: [{ targetType: "control", controlRef: "A.2.2" }, { targetType: "gate", phaseNumber: 1 }],
    content: "# Cartographer — AI Governance Scope Statement\n\nCartographer builds a curated, labeled imagery corpus for future infrastructure-condition models. In scope: collection, annotation, and quality control of the corpus. Model development is a separate, future governed project.\n",
  },
  {
    artifactType: "mission_risk_profile", phaseNumber: 1, kind: "json",
    uploadedByEmail: "dana.whitfield@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 1 }],
    payload: { system: "Cartographer", missionImpact: "moderate", autonomyLevel: "none", dataSensitivity: "high", overallTier: "moderate", rationale: "Data-only project; privacy exposure from incidental imagery content is the dominant concern." },
  },
  {
    artifactType: "data_inventory", phaseNumber: 2, kind: "file",
    fileName: "cartographer-data-inventory.md", mimeType: "text/markdown",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [],
    content: "# Cartographer — Data Inventory\n\nSources: internal field-survey imagery (licensed, cleared), two candidate public imagery sources (license review pending), drone survey batches (provenance logged per flight). Current corpus: 184k images, 41k annotated.\n",
  },
  {
    artifactType: "privacy_impact_assessment", phaseNumber: 2, kind: "file",
    fileName: "cartographer-pia-draft.md", mimeType: "text/markdown",
    uploadedByEmail: "dana.whitfield@priora.demo",
    links: [{ targetType: "risk", riskTitle: "Identifiable people in collected imagery" }],
    content: "# Cartographer — Privacy Impact Assessment (DRAFT)\n\nStreet-level batches contain faces and license plates incidental to infrastructure condition. Proposed treatment: automated blurring at ingest before any annotation; quarantine of pre-treatment batches. Status: draft pending blurring-pipeline validation results.\n",
  },
]; // 4 artifacts — early evidence, matching a Phase II story

export const LEDGER_EVIDENCE: DemoEvidence[] = [
  {
    artifactType: "ai_governance_scope_statement", phaseNumber: 1, kind: "file",
    fileName: "ledger-governance-scope.md", mimeType: "text/markdown",
    uploadedByEmail: "priya.natarajan@priora.demo",
    links: [{ targetType: "control", controlRef: "A.2.2" }, { targetType: "gate", phaseNumber: 1 }],
    content: "# Ledger — AI Governance Scope Statement\n\nLedger ranks renewal opportunities inside the enterprise CRM using an ML scoring model. Scores are advisory to account owners. In scope: feature pipeline, scoring model, score presentation. Out of scope: automated pricing or contract actions.\n",
  },
  {
    artifactType: "mission_risk_profile", phaseNumber: 1, kind: "json",
    uploadedByEmail: "dana.whitfield@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 1 }],
    payload: { system: "Ledger", missionImpact: "moderate", autonomyLevel: "advisory", dataSensitivity: "moderate", overallTier: "moderate", rationale: "Commercial decision support; human account owners retain all customer-facing decisions." },
  },
  {
    artifactType: "data_inventory", phaseNumber: 2, kind: "file",
    fileName: "ledger-data-inventory.md", mimeType: "text/markdown",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 2 }],
    content: "# Ledger — Data Inventory\n\nSources: CRM account/opportunity objects, interaction events, renewal outcomes (5 years), product telemetry aggregates. Free-text account notes explicitly EXCLUDED from the feature set (privacy treatment).\n",
  },
  {
    artifactType: "model_card", phaseNumber: 4, kind: "file",
    fileName: "ledger-model-card.md", mimeType: "text/markdown",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 4 }],
    content: "# Ledger — Model Card\n\nArchitecture: gradient-boosted trees over 212 engineered features. Output: renewal-likelihood score 0-100, refreshed nightly. Explainability: global feature importances published; per-feature attribution arrives with the v2 model (see accepted risk). Sparse-history accounts use segment-average fallback.\n",
  },
  {
    artifactType: "evaluation_report", phaseNumber: 5, kind: "file",
    fileName: "ledger-evaluation-report.md", mimeType: "text/markdown",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 5 }, { targetType: "control", controlRef: "SA-11" }],
    content: "# Ledger — Evaluation Report (Phase V)\n\nBacktest AUC 0.84 on the most recent renewal cycle. Post-mitigation regional parity: max score-gap 2.1 points (was 9.7 before region-feature removal). Calibration within tolerance across all four account segments.\n",
  },
  {
    artifactType: "go_no_go_decision_record", phaseNumber: 5, kind: "json",
    uploadedByEmail: "morgan.reyes@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 5 }],
    payload: { decision: "go", decidedBy: "Morgan Reyes (Executive Sponsor)", date: "2026-02-13", conditions: [], notes: "Parity mitigation verified; explainability residual risk handled via formal acceptance." },
  },
  {
    artifactType: "deployment_readiness_checklist", phaseNumber: 6, kind: "json",
    uploadedByEmail: "priya.natarajan@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 6 }],
    payload: { items: [ { item: "Runbook published", done: true }, { item: "Drift monitoring configured", done: true }, { item: "Incident path tested", done: true }, { item: "Rollback rehearsed", done: true }, { item: "Score-export rate limits enabled", done: true } ] },
  },
  {
    artifactType: "ai_system_runbook", phaseNumber: 6, kind: "file",
    fileName: "ledger-runbook.md", mimeType: "text/markdown",
    uploadedByEmail: "priya.natarajan@priora.demo",
    links: [],
    content: "# Ledger — AI System Runbook\n\nNightly scoring job: schedule, owners, failure paging. Degradation playbook: freeze scores at last-good snapshot, banner in CRM, escalate to ML on-call. Rollback: redeploy previous model registry tag; scores regenerate within one cycle.\n",
  },
  {
    artifactType: "monitoring_drift_management_plan", phaseNumber: 6, kind: "file",
    fileName: "ledger-drift-plan.md", mimeType: "text/markdown",
    uploadedByEmail: "felix.okafor@priora.demo",
    links: [{ targetType: "risk", riskTitle: "Stale CRM fields degrade scores" }],
    content: "# Ledger — Monitoring & Drift Management Plan\n\nWeekly PSI on the top 30 features (alert > 0.2). Score-distribution shift alarms per segment. Field-freshness dashboard feeds the operational risk treatment. Quarterly retraining unless drift triggers earlier.\n",
  },
  {
    artifactType: "post_deployment_review_report", phaseNumber: 6, kind: "file",
    fileName: "ledger-post-deployment-review.md", mimeType: "text/markdown",
    uploadedByEmail: "avery.cole@priora.demo",
    links: [{ targetType: "gate", phaseNumber: 6 }],
    content: "# Ledger — Post-Deployment Review (90 days)\n\nScore adoption: 78% of account owners consult scores weekly. No privacy or security incidents. Two drift alerts, both resolved by scheduled retraining. Accepted explainability risk on track for v2-model closure; review date 2026-12-01 held.\n",
  },
]; // 10 artifacts — full lifecycle evidence set

export const DEMO_PROJECTS = [
  {
    key: "sentinel" as const,
    name: "Sentinel",
    description: "NLP triage assistant scoring inbound support messages for urgency. Advisory routing only — Phase V, awaiting the Go/No-Go gate.",
    criticality: "high" as const,
    currentPhase: 5,
    ownerEmail: "priya.natarajan@priora.demo",
    phaseStatuses: ["complete", "complete", "complete", "complete", "awaiting_gate", "not_started"] as const,
    gates: SENTINEL_GATES,
    soa: SENTINEL_SOA,
    risks: SENTINEL_RISKS,
    evidence: SENTINEL_EVIDENCE,
    generateAep: true, // 1 prior AEP export
  },
  {
    key: "cartographer" as const,
    name: "Cartographer",
    description: "Computer-vision data project: curated, labeled imagery corpus for future infrastructure-condition models. Phase II — Data Understanding.",
    criticality: "medium" as const,
    currentPhase: 2,
    ownerEmail: "priya.natarajan@priora.demo",
    phaseStatuses: ["complete", "in_progress", "not_started", "not_started", "not_started", "not_started"] as const,
    gates: CARTOGRAPHER_GATES,
    soa: CARTOGRAPHER_SOA,
    risks: CARTOGRAPHER_RISKS,
    evidence: CARTOGRAPHER_EVIDENCE,
    generateAep: false,
  },
  {
    key: "ledger" as const,
    name: "Ledger",
    description: "Enterprise-CRM ML scoring initiative ranking renewal opportunities. Phase VI — operational, all gates approved.",
    criticality: "mission_critical" as const,
    currentPhase: 6,
    ownerEmail: "priya.natarajan@priora.demo",
    phaseStatuses: ["complete", "complete", "complete", "complete", "complete", "in_progress"] as const,
    gates: LEDGER_GATES,
    soa: LEDGER_SOA,
    risks: LEDGER_RISKS,
    evidence: LEDGER_EVIDENCE,
    generateAep: false,
  },
];

// project_assignments — RACI-lite, every governance function staffed per project
export const DEMO_ASSIGNMENT_ROLES = [
  { email: "avery.cole@priora.demo", role: "governance_lead" },
  { email: "morgan.reyes@priora.demo", role: "executive_sponsor" },
  { email: "priya.natarajan@priora.demo", role: "program_manager" },
  { email: "felix.okafor@priora.demo", role: "ml_engineer" },
  { email: "dana.whitfield@priora.demo", role: "risk_officer" },
  { email: "sam.aldous@priora.demo", role: "auditor" },
] as const;
