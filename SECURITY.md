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

## Out of scope (documented future roadmap)

CCV/ACVR automation, telemetry ingestion hardening, and DoD CSRMC-aligned
controls are v3 roadmap items tracked in the README.
