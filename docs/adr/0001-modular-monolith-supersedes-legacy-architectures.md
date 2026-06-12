# ADR-0001: Modular monolith supersedes legacy microservices and Firebase architectures

**Status:** Accepted (2026-06-11)

## Context

Two prior architecture documents exist for this product (then named "Enterprise
AI Governance Orchestration Suite"):

1. **SDD v1.0 (Dec 2025)** — microservices: React SPA, FastAPI services, a Go
   telemetry worker, PostgreSQL, Neo4j, Kafka/RabbitMQ, MinIO, Vault, K8s.
2. **App Build User Stories v2.0 (Jan 2026)** — single-tenant, customer-hosted
   Firebase (Firestore, Cloud Functions, Firebase Auth/Storage).

These contradict each other, and both misfit the actual constraints: a
solo-built portfolio-grade product whose v1 value is the decision/evidence
layer, not high-throughput telemetry. The SDD provisions five datastores
before the first user; the Firebase design couples the product to a
proprietary BaaS, conflicting with the original requirement for
on-prem/air-gapped deployability.

## Decision

Build Priora as a **modular monolith**: Next.js 15 (App Router) + TypeScript,
PostgreSQL via Drizzle ORM, deployed as one unit. Domain logic lives in
`src/modules/*` as framework-independent, unit-testable functions. Evidence
traceability is modeled relationally (typed link tables + recursive CTEs) —
no graph database at this scale.

## Consequences

- One language, one repo, one deployable; demo instance and local/private
  instance differ only by runtime profile.
- The v3 roadmap (CCV/ACVR rules engine, telemetry ingestion) may eventually
  justify extracting a worker process. That extraction is cheap *because*
  domain logic is already isolated in modules.
- The legacy SRD's functional requirements (FR-01…FR-24) and MTP traceability
  matrix remain valid inputs; their architecture documents are superseded.
