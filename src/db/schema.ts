import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  controlFramework,
  correctiveActionStatus,
  criticality,
  evidenceLinkTarget,
  gateDecision,
  phaseStatus,
  projectStatus,
  ratingLevel,
  riskDomain,
  riskStatus,
  soaApplicability,
  soaImplementationStatus,
  userRole,
} from "./enums";

export * from "./enums";

export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// users — passwordHash via bcryptjs (12 rounds); role is the user's GLOBAL function
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// projects — the governed AI system
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  criticality: criticality("criticality").notNull().default("medium"),
  status: projectStatus("status").notNull().default("active"),
  currentPhase: integer("current_phase").notNull().default(1), // 1..6
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// project_assignments — RACI-lite: who holds which governance function on which project
export const projectAssignments = pgTable(
  "project_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: userRole("role").notNull(),
  },
  (t) => [unique().on(t.projectId, t.userId, t.role)],
);

// phases — exactly 6 rows created per project at project creation
export const phases = pgTable(
  "phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    phaseNumber: integer("phase_number").notNull(), // 1..6
    status: phaseStatus("status").notNull().default("not_started"),
  },
  (t) => [unique().on(t.projectId, t.phaseNumber)],
);

// gates — one per phase; created with the phase; decision NULL until reviewed
export const gates = pgTable("gates", {
  id: uuid("id").primaryKey().defaultRandom(),
  phaseId: uuid("phase_id")
    .notNull()
    .references(() => phases.id)
    .unique(),
  decision: gateDecision("decision"), // NULL = not yet decided
  rationale: text("rationale"),
  decidedById: uuid("decided_by_id").references(() => users.id),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

// corrective_actions — auto-created when a gate is conditionally_approved
export const correctiveActions = pgTable("corrective_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  gateId: uuid("gate_id")
    .notNull()
    .references(() => gates.id),
  description: text("description").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  status: correctiveActionStatus("status").notNull().default("open"),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

// risks — 3x3 likelihood x impact, 7-domain taxonomy
export const risks = pgTable("risks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  domain: riskDomain("domain").notNull(),
  likelihood: ratingLevel("likelihood").notNull(),
  impact: ratingLevel("impact").notNull(),
  status: riskStatus("status").notNull().default("open"),
  treatment: text("treatment").notNull().default(""),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// controls — master library (NOT project-scoped). Short titles paraphrased,
// never verbatim ISO text (licensing — spec §10).
export const controls = pgTable(
  "controls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    framework: controlFramework("framework").notNull(),
    ref: text("ref").notNull(), // e.g. "A.5.1", "AC-2"
    title: text("title").notNull(), // paraphrased short title
    isoClause: text("iso_clause"), // triple mapping (playbook App. C/D)
    aiRmfFunction: text("ai_rmf_function"), // "govern" | "map" | "measure" | "manage"
    csrmcElement: text("csrmc_element"), // "MRP"|"AEP"|"CCV"|"RES"|"REC"|"TEL"|null
  },
  (t) => [unique().on(t.framework, t.ref)],
);

// soa_entries — per-project clone of the library
export const soaEntries = pgTable(
  "soa_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    controlId: uuid("control_id")
      .notNull()
      .references(() => controls.id),
    applicability: soaApplicability("applicability")
      .notNull()
      .default("applicable"),
    // REQUIRED non-empty when not_applicable — enforced in module logic + zod
    justification: text("justification").notNull().default(""),
    implementationStatus: soaImplementationStatus("implementation_status")
      .notNull()
      .default("not_implemented"),
  },
  (t) => [unique().on(t.projectId, t.controlId)],
);

// risk_control_links — risk <-> project-scoped control (soa_entries)
export const riskControlLinks = pgTable(
  "risk_control_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id")
      .notNull()
      .references(() => risks.id),
    soaEntryId: uuid("soa_entry_id")
      .notNull()
      .references(() => soaEntries.id),
  },
  (t) => [unique().on(t.riskId, t.soaEntryId)],
);

// risk_acceptances — thin in v1
export const riskAcceptances = pgTable("risk_acceptances", {
  id: uuid("id").primaryKey().defaultRandom(),
  riskId: uuid("risk_id")
    .notNull()
    .references(() => risks.id),
  rationale: text("rationale").notNull(),
  acceptedById: uuid("accepted_by_id")
    .notNull()
    .references(() => users.id),
  acceptedAt: timestamp("accepted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  reviewBy: timestamp("review_by", { withTimezone: true }),
});

// evidence_artifacts — file OR inline JSON payload; sha256 computed server-side at ingest
export const evidenceArtifacts = pgTable("evidence_artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  phaseNumber: integer("phase_number").notNull(), // 1..6
  artifactType: text("artifact_type").notNull(), // from ARTIFACT_TYPES catalog
  fileName: text("file_name"),
  storagePath: text("storage_path"), // null when jsonPayload is used
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  jsonPayload: jsonb("json_payload"), // null when file is used
  sha256: text("sha256").notNull(), // 64 hex chars, lowercase
  version: integer("version").notNull().default(1),
  uploadedById: uuid("uploaded_by_id")
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// evidence_links — typed edges of the traceability chain
export const evidenceLinks = pgTable(
  "evidence_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidenceArtifacts.id),
    targetType: evidenceLinkTarget("target_type").notNull(),
    targetId: uuid("target_id").notNull(), // soa_entries.id | gates.id | risks.id per targetType
  },
  (t) => [unique().on(t.evidenceId, t.targetType, t.targetId)],
);

// aep_exports — every generated package is itself evidence
export const aepExports = pgTable("aep_exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  manifest: jsonb("manifest").notNull(), // AepManifest
  packageSha256: text("package_sha256").notNull(),
  storagePath: text("storage_path").notNull(),
  generatedById: uuid("generated_by_id")
    .notNull()
    .references(() => users.id),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// audit_log — append-only; INSERT-only enforced at DB privilege layer
// (runtime role `priora_app` has INSERT/SELECT only here, plus a
// BEFORE UPDATE OR DELETE trigger as defense-in-depth — see migration 0002)
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id), // null = system
  action: text("action").notNull(), // e.g. "project.create", "gate.decide"
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
