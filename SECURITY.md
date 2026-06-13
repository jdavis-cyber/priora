# Security Policy

## Reporting

This is a private repository. Report suspected vulnerabilities directly to
the repository owner via GitHub issues marked `security` (private repo) or
email jdavis.cyber@gmail.com.

## Posture (M0 baseline)

- No secrets in the repository. Configuration is environment-based
  (`.env.example` documents required variables; `.env` is gitignored).
- CI runs gitleaks secret scanning on every push and PR.
- All commits are SSH-signed; `main` is branch-protected (PRs only, CI
  required, no force pushes).
- Dependabot monitors npm and GitHub Actions dependencies weekly.
- The audit log (M1+) is enforced append-only at the database privilege
  layer, not application code.

## Public demo posture (M6)

The hosted demo (`APP_PROFILE=demo`) is semi-public by design. Controls and
accepted residual risks:

- **Fictional data only.** The demo seed contains no real organizations,
  people, or governance content; it resets daily at 09:00 UTC.
- **Shared credentials are intentional.** Demo logins are published in the
  README. `user.manage` is disabled in the demo profile so visitors cannot
  change passwords, lock out roles, or create accounts — and v1 ships no
  user-administration UI/action at all, so the capability is simply absent.
- **Rate limiting (accepted residual risk).** v1 relies on Vercel's
  platform-level abuse protections and Auth.js defaults (hashed credentials,
  JWT sessions). No application-level rate limiter is deployed; for a
  fictional, daily-reset dataset the impact of brute-force or scripted abuse
  is data noise lasting < 24 hours. Revisit before any non-demo hosting.
- **Vercel Blob URLs (accepted residual risk).** Evidence files are stored
  at public-but-unguessable Blob URLs. All stored files are small fictional
  fixtures; no confidential content may ever be uploaded to the demo.
- **Least-privilege runtime.** The app connects to Neon as the restricted
  `priora_app` role (INSERT/SELECT-only on `audit_log`); its committed dev
  password is rotated to a generated secret on the hosted instance. Owner
  credentials are used only for migrations and the daily reset job.
- **Secrets.** AUTH_SECRET is generated (`openssl rand -base64 32`) per
  environment and never committed; database and Blob credentials live only
  in Vercel env vars and GitHub Actions secrets. gitleaks gates every push.

## Out of scope (documented future roadmap)

CCV/ACVR automation, telemetry ingestion hardening, and DoD CSRMC-aligned
controls are v3 roadmap items tracked in the README.
