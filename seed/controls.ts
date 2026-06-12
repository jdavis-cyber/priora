// Priora control library seed — ISO/IEC 42001:2023 Annex A (A.2–A.10) + selected
// NIST SP 800-53 Rev 5. Titles are SHORT PARAPHRASES, never verbatim standard text
// (ISO licensing — spec §10). Triple mappings (isoClause / aiRmfFunction /
// csrmcElement) are sourced from the playbook's Appendix C/D crosswalks.
// Rows tagged // VERIFY need a human check against Appendix C before demo day.

export type ControlSeed = {
  framework: "iso_42001" | "nist_800_53";
  ref: string;
  title: string;
  isoClause: string | null;
  aiRmfFunction: "govern" | "map" | "measure" | "manage" | null;
  csrmcElement: "MRP" | "AEP" | "CCV" | "RES" | "REC" | "TEL" | null;
};

export const CONTROL_SEEDS: ControlSeed[] = [
  // ── ISO/IEC 42001:2023 Annex A ─────────────────────────────────────────────
  // A.2 — AI policy
  { framework: "iso_42001", ref: "A.2.2", title: "Establish and maintain an organizational AI policy", isoClause: "5.2", aiRmfFunction: "govern", csrmcElement: null },
  { framework: "iso_42001", ref: "A.2.3", title: "Keep the AI policy aligned with other organizational policies", isoClause: "5.2", aiRmfFunction: "govern", csrmcElement: null },
  { framework: "iso_42001", ref: "A.2.4", title: "Review the AI policy at planned intervals", isoClause: "9.3", aiRmfFunction: "govern", csrmcElement: null }, // VERIFY isoClause (9.3 management review vs 5.2)
  // A.3 — Internal organization
  { framework: "iso_42001", ref: "A.3.2", title: "Define and allocate AI roles and responsibilities", isoClause: "5.3", aiRmfFunction: "govern", csrmcElement: null },
  { framework: "iso_42001", ref: "A.3.3", title: "Provide a channel for raising concerns about AI systems", isoClause: "5.3", aiRmfFunction: "govern", csrmcElement: "RES" }, // VERIFY csrmcElement (RES vs null)
  // A.4 — Resources for AI systems
  { framework: "iso_42001", ref: "A.4.2", title: "Document the resources required across the AI life cycle", isoClause: "7.1", aiRmfFunction: "map", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.4.3", title: "Document the data resources used by the AI system", isoClause: "7.1", aiRmfFunction: "map", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.4.4", title: "Document the tooling resources used by the AI system", isoClause: "7.1", aiRmfFunction: "map", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.4.5", title: "Document the system and computing resources used", isoClause: "7.1", aiRmfFunction: "map", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.4.6", title: "Document the human resources and competencies needed", isoClause: "7.2", aiRmfFunction: "map", csrmcElement: null },
  // A.5 — Assessing impacts of AI systems
  { framework: "iso_42001", ref: "A.5.2", title: "Establish a process for assessing AI system impacts", isoClause: "8.4", aiRmfFunction: "map", csrmcElement: "MRP" },
  { framework: "iso_42001", ref: "A.5.3", title: "Document the results of AI impact assessments", isoClause: "8.4", aiRmfFunction: "map", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.5.4", title: "Assess AI impacts on individuals and groups", isoClause: "8.4", aiRmfFunction: "map", csrmcElement: "MRP" },
  { framework: "iso_42001", ref: "A.5.5", title: "Assess societal impacts of the AI system", isoClause: "8.4", aiRmfFunction: "map", csrmcElement: "MRP" },
  // A.6 — AI system life cycle
  { framework: "iso_42001", ref: "A.6.1.2", title: "Define objectives for responsible AI development", isoClause: "6.2", aiRmfFunction: "govern", csrmcElement: null },
  { framework: "iso_42001", ref: "A.6.1.3", title: "Define processes for responsible AI design and development", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: null },
  { framework: "iso_42001", ref: "A.6.2.2", title: "Specify and document AI system requirements", isoClause: "8.1", aiRmfFunction: "map", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.6.2.3", title: "Document AI system design and development choices", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.6.2.4", title: "Verify and validate the AI system against its requirements", isoClause: "8.1", aiRmfFunction: "measure", csrmcElement: "CCV" },
  { framework: "iso_42001", ref: "A.6.2.5", title: "Control the deployment of the AI system", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: null },
  { framework: "iso_42001", ref: "A.6.2.6", title: "Operate and monitor the AI system in production", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: "TEL" },
  { framework: "iso_42001", ref: "A.6.2.7", title: "Maintain technical documentation for the AI system", isoClause: "7.5", aiRmfFunction: "manage", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.6.2.8", title: "Record event logs of AI system operation", isoClause: "8.1", aiRmfFunction: "measure", csrmcElement: "TEL" },
  // A.7 — Data for AI systems
  { framework: "iso_42001", ref: "A.7.2", title: "Manage data used for AI development and enhancement", isoClause: "8.1", aiRmfFunction: "map", csrmcElement: null },
  { framework: "iso_42001", ref: "A.7.3", title: "Document how data is acquired and selected", isoClause: "8.1", aiRmfFunction: "map", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.7.4", title: "Define and meet data quality requirements", isoClause: "8.1", aiRmfFunction: "measure", csrmcElement: "CCV" },
  { framework: "iso_42001", ref: "A.7.5", title: "Record the provenance of data used by the AI system", isoClause: "8.1", aiRmfFunction: "map", csrmcElement: "AEP" },
  { framework: "iso_42001", ref: "A.7.6", title: "Document data preparation methods and transformations", isoClause: "8.1", aiRmfFunction: "map", csrmcElement: "AEP" },
  // A.8 — Information for interested parties
  { framework: "iso_42001", ref: "A.8.2", title: "Provide users with documentation about the AI system", isoClause: "7.4", aiRmfFunction: "govern", csrmcElement: null },
  { framework: "iso_42001", ref: "A.8.3", title: "Enable interested parties to report adverse impacts", isoClause: "7.4", aiRmfFunction: "govern", csrmcElement: "RES" }, // VERIFY csrmcElement
  { framework: "iso_42001", ref: "A.8.4", title: "Communicate AI incidents to interested parties", isoClause: "7.4", aiRmfFunction: "manage", csrmcElement: "RES" },
  { framework: "iso_42001", ref: "A.8.5", title: "Inform interested parties of their obligations", isoClause: "7.4", aiRmfFunction: "govern", csrmcElement: null },
  // A.9 — Use of AI systems
  { framework: "iso_42001", ref: "A.9.2", title: "Define processes for responsible use of AI systems", isoClause: "8.1", aiRmfFunction: "govern", csrmcElement: null },
  { framework: "iso_42001", ref: "A.9.3", title: "Define objectives for responsible use of AI systems", isoClause: "6.2", aiRmfFunction: "govern", csrmcElement: null },
  { framework: "iso_42001", ref: "A.9.4", title: "Ensure the AI system is used according to its intended purpose", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: null },
  // A.10 — Third-party and customer relationships
  { framework: "iso_42001", ref: "A.10.2", title: "Allocate AI responsibilities among third parties and customers", isoClause: "8.1", aiRmfFunction: "govern", csrmcElement: "REC" },
  { framework: "iso_42001", ref: "A.10.3", title: "Ensure supplier practices align with the AI policy", isoClause: "8.1", aiRmfFunction: "govern", csrmcElement: "REC" },
  { framework: "iso_42001", ref: "A.10.4", title: "Address customer needs and expectations for responsible AI", isoClause: "8.1", aiRmfFunction: "govern", csrmcElement: null },

  // ── NIST SP 800-53 Rev 5 — selected AI-relevant subset ─────────────────────
  { framework: "nist_800_53", ref: "AC-2", title: "Manage system accounts through their full life cycle", isoClause: "8.1", aiRmfFunction: "govern", csrmcElement: null }, // VERIFY isoClause
  { framework: "nist_800_53", ref: "AC-3", title: "Enforce approved authorizations for system access", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: null },
  { framework: "nist_800_53", ref: "AC-6", title: "Apply least privilege to users and processes", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: null },
  { framework: "nist_800_53", ref: "AU-2", title: "Define the events the system must log", isoClause: "8.1", aiRmfFunction: "measure", csrmcElement: "TEL" },
  { framework: "nist_800_53", ref: "AU-6", title: "Review and analyze audit records for anomalies", isoClause: "9.1", aiRmfFunction: "measure", csrmcElement: "CCV" },
  { framework: "nist_800_53", ref: "AU-9", title: "Protect audit information from tampering and deletion", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: "AEP" }, // VERIFY csrmcElement (AEP integrity vs TEL)
  { framework: "nist_800_53", ref: "CA-7", title: "Monitor control effectiveness continuously", isoClause: "9.1", aiRmfFunction: "measure", csrmcElement: "CCV" },
  { framework: "nist_800_53", ref: "CM-3", title: "Control changes through a managed configuration process", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: "MRP" }, // VERIFY csrmcElement (Material Change Evaluation linkage)
  { framework: "nist_800_53", ref: "CM-4", title: "Analyze the impact of proposed changes before approval", isoClause: "8.4", aiRmfFunction: "manage", csrmcElement: "MRP" }, // VERIFY isoClause + csrmcElement
  { framework: "nist_800_53", ref: "IR-4", title: "Handle incidents from detection through recovery", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: "RES" },
  { framework: "nist_800_53", ref: "IR-6", title: "Report incidents to the required internal and external parties", isoClause: "7.4", aiRmfFunction: "manage", csrmcElement: "RES" },
  { framework: "nist_800_53", ref: "PL-8", title: "Document a security and privacy architecture for the system", isoClause: "6.1", aiRmfFunction: "map", csrmcElement: "AEP" }, // VERIFY isoClause
  { framework: "nist_800_53", ref: "RA-3", title: "Conduct and keep current a risk assessment", isoClause: "6.1", aiRmfFunction: "map", csrmcElement: "MRP" },
  { framework: "nist_800_53", ref: "RA-5", title: "Scan for vulnerabilities and remediate findings", isoClause: "8.1", aiRmfFunction: "measure", csrmcElement: "CCV" },
  { framework: "nist_800_53", ref: "SA-11", title: "Require developer security testing and evaluation", isoClause: "8.1", aiRmfFunction: "measure", csrmcElement: "CCV" },
  { framework: "nist_800_53", ref: "SC-8", title: "Protect the confidentiality and integrity of data in transit", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: null },
  { framework: "nist_800_53", ref: "SC-28", title: "Protect the confidentiality and integrity of data at rest", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: null },
  { framework: "nist_800_53", ref: "SI-4", title: "Monitor the system to detect attacks and anomalous activity", isoClause: "8.1", aiRmfFunction: "measure", csrmcElement: "TEL" },
  { framework: "nist_800_53", ref: "SI-7", title: "Verify the integrity of software, firmware, and information", isoClause: "8.1", aiRmfFunction: "measure", csrmcElement: "AEP" },
  { framework: "nist_800_53", ref: "SI-10", title: "Validate the accuracy and format of information inputs", isoClause: "8.1", aiRmfFunction: "measure", csrmcElement: null },
  { framework: "nist_800_53", ref: "PM-31", title: "Maintain an organization-wide continuous monitoring strategy", isoClause: "9.1", aiRmfFunction: "measure", csrmcElement: "CCV" },
  { framework: "nist_800_53", ref: "AT-2", title: "Provide literacy training and awareness for all users", isoClause: "7.3", aiRmfFunction: "govern", csrmcElement: null },
  { framework: "nist_800_53", ref: "AT-3", title: "Provide role-based training for assigned duties", isoClause: "7.2", aiRmfFunction: "govern", csrmcElement: null },
  { framework: "nist_800_53", ref: "MP-6", title: "Sanitize media before disposal or reuse", isoClause: "8.1", aiRmfFunction: "manage", csrmcElement: null }, // VERIFY isoClause
  { framework: "nist_800_53", ref: "PS-3", title: "Screen personnel before granting system access", isoClause: "7.2", aiRmfFunction: "govern", csrmcElement: null }, // VERIFY isoClause
];
