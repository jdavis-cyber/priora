# ADR-0002: Technology stack selection

**Status:** Accepted (2026-06-11)

## Decision and rationale

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15, App Router, RSC | Dashboard-heavy app: server-rendered reads, server actions for mutations; one framework for UI + API; free-tier deployable for the public demo |
| Language | TypeScript everywhere | One language solo; zod-validated boundaries |
| Database | PostgreSQL 17 | ACID for governance records; INSERT-only grants enforce the append-only audit log at the DB layer |
| ORM | Drizzle | Schema as typed source code; plain-SQL migrations an auditor can read line-by-line; drift check in CI |
| Auth | Auth.js (NextAuth v5) | Credentials/email for v1; provider abstraction makes enterprise SSO (Okta/Entra) a configuration change |
| Files | Local-filesystem driver behind a storage interface | S3-compatible driver is a swap, not a rewrite |
| Tests | Vitest (+ Playwright at M5) | Fast, TS-native |
| Runtime | Docker Compose (colima on macOS) | `live` profile runs fully local; no data leaves the machine |

## Rejected alternatives

- **FastAPI + React (two codebases):** slower solo; Python's ML ecosystem is
  irrelevant to v1 — Priora orchestrates evidence about models, it does not
  train them.
- **Neo4j for the evidence graph:** at portfolio/team scale the traceability
  chain (Requirement→Control→Evidence→Hash) is a handful of typed join
  tables; recursive CTEs cover lineage queries.
- **Firebase:** vendor lock-in, weak air-gap story, NoSQL fit poor for
  register-style relational data (see ADR-0001).
