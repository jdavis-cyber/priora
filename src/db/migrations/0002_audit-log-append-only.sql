-- NFR-01: audit_log is append-only, enforced at the DATABASE level, not application code.
--
-- Layer 1 — least-privilege runtime role `priora_app`:
--   * full DML on application tables (and on future tables via default privileges,
--     since all migrations run as the owner role)
--   * INSERT + SELECT only on audit_log (UPDATE/DELETE revoked)
-- Layer 2 — defense-in-depth trigger: BEFORE UPDATE OR DELETE raises an exception,
--   blocking even the owner role unless the trigger is first dropped (an act that is
--   itself visible in migration history / DB logs).
--
-- The dev password below is dev/demo only. Hosted environments must rotate it out of
-- band: ALTER ROLE priora_app PASSWORD '<injected secret>';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'priora_app') THEN
    CREATE ROLE priora_app LOGIN PASSWORD 'priora_app_dev_only';
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO priora_app', current_database());
END
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO priora_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO priora_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO priora_app;
--> statement-breakpoint
REVOKE UPDATE, DELETE ON public.audit_log FROM priora_app;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION audit_log_block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: % rejected', TG_OP;
END;
$fn$;
--> statement-breakpoint
CREATE TRIGGER audit_log_append_only
BEFORE UPDATE OR DELETE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();
