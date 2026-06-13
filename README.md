# Priora

[![ci](https://github.com/jdavis-cyber/priora/actions/workflows/ci.yml/badge.svg)](https://github.com/jdavis-cyber/priora/actions/workflows/ci.yml)

> **Priora** (pree-OR-uh, Latin: *"the things that come before"*) — an AI
> lifecycle governance platform operationalizing
> *The Decisions That Come Before Scale: An AI Lifecycle Playbook for
> Regulated Environments*.

Priora is a single system of record for AI governance: every AI project's
position in the CPMAI lifecycle (Phases I–VI, tri-state phase gates), living
risk and control registers, hash-verified evidence, and one-click
**Automated Evidence Package (AEP)** generation for auditors.

**Status:** v1 shipped — live demo below. M0–M6 complete.

![Priora Mission Dashboard](docs/assets/dashboard.png)

## Live demo

**URL:** <https://priora-gules.vercel.app>  ·  Data resets daily at 09:00 UTC. All content is fictional.

| Role | Login | Password |
|---|---|---|
| Governance Lead | `avery.cole@priora.demo` | `demo-priora-2026` |
| Executive Sponsor | `morgan.reyes@priora.demo` | `demo-priora-2026` |
| Program Manager | `priya.natarajan@priora.demo` | `demo-priora-2026` |
| ML Engineer | `felix.okafor@priora.demo` | `demo-priora-2026` |
| Risk Officer | `dana.whitfield@priora.demo` | `demo-priora-2026` |
| Auditor (read-only) | `sam.aldous@priora.demo` | `demo-priora-2026` |

Suggested tour: log in as **Governance Lead** → Mission Dashboard → open a
project → Gate Register → Evidence Locker → "Verify Integrity" → generate an
AEP. Then log in as **Auditor** and confirm everything is visible but nothing
is editable.

## Why it exists

Most organizations govern AI with static policies, spreadsheets, and
after-the-fact reviews. Priora makes governance an execution layer:
decisions are recorded where they happen, evidence is born traceable, and
audit readiness is a button, not a quarter.

## Architecture

Modular monolith — Next.js 15 (App Router) + TypeScript, PostgreSQL +
Drizzle. Domain logic lives in `src/modules/*` as framework-independent,
requirement-traced functions. See [ADR-0001](docs/adr/0001-modular-monolith-supersedes-legacy-architectures.md)
and [ADR-0002](docs/adr/0002-technology-stack.md).

## Engineering standards

- **TDD with requirement-named tests** — [docs/rtm.md](docs/rtm.md) traces
  requirement → module → test
- **Signed commits, protected main, CI-gated merges** — the repo practices
  the phase-gate discipline the product enforces
- **ADRs for every load-bearing decision** — [docs/adr/](docs/adr/)
- **Schema drift check** — migrations are mandatory, reviewed SQL

## Roadmap

| Phase | Scope |
|---|---|
| **v1 (M1–M6)** | Decision/evidence layer: lifecycle engine + gates, risk register (3×3, 7 domains), SoA, evidence locker (SHA-256), AEP generator, mission dashboard, RBAC + append-only audit log, hosted demo |
| **v2** | MRP wizard, risk-acceptance workflow, reciprocity & inheritance register, governance cadence calendar, material change evaluation, maturity scoring |
| **v3 (tracking DoD CSRMC as it matures)** | Continuous Compliance Validation (CCV) engine, Automated Control Validation Ruleset (ACVR), telemetry ingestion, incident ticketing, supplier & competency management |

## Run it locally

```bash
cp .env.example .env
docker compose up -d        # Postgres 17
npm ci
npm run db:migrate
npm run dev
```

`npm test` · `npm run typecheck` · `npm run lint` · `npm run db:check`

To run the demo profile locally: `APP_PROFILE=demo npm run dev` (banner on, user
management disabled). Seed it first: `npm run seed -- --profile demo`.
