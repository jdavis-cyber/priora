CREATE TYPE "public"."control_framework" AS ENUM('iso_42001', 'nist_800_53');--> statement-breakpoint
CREATE TYPE "public"."corrective_action_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."criticality" AS ENUM('low', 'medium', 'high', 'mission_critical');--> statement-breakpoint
CREATE TYPE "public"."evidence_link_target" AS ENUM('control', 'gate', 'risk');--> statement-breakpoint
CREATE TYPE "public"."gate_decision" AS ENUM('approved', 'conditionally_approved', 'not_approved');--> statement-breakpoint
CREATE TYPE "public"."phase_status" AS ENUM('not_started', 'in_progress', 'awaiting_gate', 'complete');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."rating_level" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TYPE "public"."risk_domain" AS ENUM('technical', 'ethical', 'operational', 'cybersecurity', 'privacy', 'regulatory', 'mission_driven');--> statement-breakpoint
CREATE TYPE "public"."risk_status" AS ENUM('open', 'mitigated', 'accepted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."soa_applicability" AS ENUM('applicable', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."soa_implementation_status" AS ENUM('not_implemented', 'partially_implemented', 'implemented', 'inherited');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('governance_lead', 'executive_sponsor', 'program_manager', 'ml_engineer', 'risk_officer', 'auditor');--> statement-breakpoint
CREATE TABLE "aep_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"manifest" jsonb NOT NULL,
	"package_sha256" text NOT NULL,
	"storage_path" text NOT NULL,
	"generated_by_id" uuid NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"framework" "control_framework" NOT NULL,
	"ref" text NOT NULL,
	"title" text NOT NULL,
	"iso_clause" text,
	"ai_rmf_function" text,
	"csrmc_element" text,
	CONSTRAINT "controls_framework_ref_unique" UNIQUE("framework","ref")
);
--> statement-breakpoint
CREATE TABLE "corrective_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gate_id" uuid NOT NULL,
	"description" text NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"status" "corrective_action_status" DEFAULT 'open' NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "evidence_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"phase_number" integer NOT NULL,
	"artifact_type" text NOT NULL,
	"file_name" text,
	"storage_path" text,
	"mime_type" text,
	"size_bytes" integer,
	"json_payload" jsonb,
	"sha256" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"uploaded_by_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_id" uuid NOT NULL,
	"target_type" "evidence_link_target" NOT NULL,
	"target_id" uuid NOT NULL,
	CONSTRAINT "evidence_links_evidence_id_target_type_target_id_unique" UNIQUE("evidence_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "gates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid NOT NULL,
	"decision" "gate_decision",
	"rationale" text,
	"decided_by_id" uuid,
	"decided_at" timestamp with time zone,
	CONSTRAINT "gates_phase_id_unique" UNIQUE("phase_id")
);
--> statement-breakpoint
CREATE TABLE "phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"phase_number" integer NOT NULL,
	"status" "phase_status" DEFAULT 'not_started' NOT NULL,
	CONSTRAINT "phases_project_id_phase_number_unique" UNIQUE("project_id","phase_number")
);
--> statement-breakpoint
CREATE TABLE "project_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" NOT NULL,
	CONSTRAINT "project_assignments_project_id_user_id_role_unique" UNIQUE("project_id","user_id","role")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"criticality" "criticality" DEFAULT 'medium' NOT NULL,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"current_phase" integer DEFAULT 1 NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"rationale" text NOT NULL,
	"accepted_by_id" uuid NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"review_by" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "risk_control_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"risk_id" uuid NOT NULL,
	"soa_entry_id" uuid NOT NULL,
	CONSTRAINT "risk_control_links_risk_id_soa_entry_id_unique" UNIQUE("risk_id","soa_entry_id")
);
--> statement-breakpoint
CREATE TABLE "risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"domain" "risk_domain" NOT NULL,
	"likelihood" "rating_level" NOT NULL,
	"impact" "rating_level" NOT NULL,
	"status" "risk_status" DEFAULT 'open' NOT NULL,
	"treatment" text DEFAULT '' NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soa_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"control_id" uuid NOT NULL,
	"applicability" "soa_applicability" DEFAULT 'applicable' NOT NULL,
	"justification" text DEFAULT '' NOT NULL,
	"implementation_status" "soa_implementation_status" DEFAULT 'not_implemented' NOT NULL,
	CONSTRAINT "soa_entries_project_id_control_id_unique" UNIQUE("project_id","control_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "aep_exports" ADD CONSTRAINT "aep_exports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aep_exports" ADD CONSTRAINT "aep_exports_generated_by_id_users_id_fk" FOREIGN KEY ("generated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_artifacts" ADD CONSTRAINT "evidence_artifacts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_artifacts" ADD CONSTRAINT "evidence_artifacts_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_evidence_id_evidence_artifacts_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_artifacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gates" ADD CONSTRAINT "gates_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gates" ADD CONSTRAINT "gates_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phases" ADD CONSTRAINT "phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_acceptances" ADD CONSTRAINT "risk_acceptances_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_acceptances" ADD CONSTRAINT "risk_acceptances_accepted_by_id_users_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_control_links" ADD CONSTRAINT "risk_control_links_risk_id_risks_id_fk" FOREIGN KEY ("risk_id") REFERENCES "public"."risks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_control_links" ADD CONSTRAINT "risk_control_links_soa_entry_id_soa_entries_id_fk" FOREIGN KEY ("soa_entry_id") REFERENCES "public"."soa_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soa_entries" ADD CONSTRAINT "soa_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soa_entries" ADD CONSTRAINT "soa_entries_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE no action ON UPDATE no action;