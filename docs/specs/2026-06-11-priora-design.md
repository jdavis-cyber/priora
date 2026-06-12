---
Date: 2026-06-11
Tags: [Project, AI Governance, Priora, Design Spec]
Status: Approved by Jerome 2026-06-11 — pending implementation planning
Supersedes: SDD v1.0 architecture (Dec 2025); App Build User Stories v2.0 Firebase architecture (Jan 2026)
Canonical domain source: "The Decisions That Come Before Scale — An AI Lifecycle Playbook for Regulated Environments" (Jerome Davis, 97 pp.)
---

# Priora — Design Specification v1.0

**Priora** (pree-OR-uh, Latin: "the things that come before") is an AI lifecycle governance platform that operationalizes *The Decisions That Come Before Scale*. It is the "Vanta for AI governance": a single system of record where all stakeholders see a live snapshot of every AI project's lifecycle position, and the single interface for evidence storage, integrity tracking, and Automated Evidence Package (AEP) generation.

## 1. Purpose, users, and positioning

- **Primary purpose (v1):** internal-first governance platform AND professional portfolio artifact demonstrating Jerome's capability as an AI Governance Executive and Cybersecurity Compliance Auditor. The repo itself is part of the credential.
- **v1 users:** Jerome + AIMS-style stakeholders (Governance Lead, Executive Sponsor, PM, ML Engineer, Risk Officer, Auditor). First governed projects: Lliam, DoW PM Builder, and an enterprise-CRM-program-shaped initiative.
- **Dual runtime profiles (decision: "C — both, by design"):**
  - `demo` — seeded, sanitized, resettable; hostable on free-tier cloud with a public demo URL for portfolio use.
  - `live` — real governance content; runs locally via Docker Compose; nothing leaves Jerome's machine.
- **Quality bar:** demoability and visible engineering craft outrank enterprise-scale features. The dashboard, evidence chain, audit log, and repo hygiene are what reviewers will see.

## 2. Source-of-truth hierarchy

1. **The playbook PDF** — canonical domain language, lifecycle, gates, roles, artifact catalog, AEP/CCV definitions. Key terms: AEP = *Automated Evidence Package* (glossary p. 95); CCV = Continuous Compliance Validation; ACVR = Automated Control Validation Ruleset; MRP = Mission Risk Profile; gate decisions are tri-state.
2. **SRD v3.0** — functional requirement list (FR-01…FR-24) and RTM, reused where consistent with the book.
3. Everything else in the legacy design package is historical reference. The SDD's microservices architecture (FastAPI/Go/Neo4j/Kafka/K8s) and the Firebase user-stories architecture are both explicitly superseded (to be recorded as ADR-0001).

## 3. Architecture

**Modular monolith. One repo, one language, one deployable.**

- **Framework:** Next.js 15 (App Router), React Server Components, TypeScript throughout. Mutations via server actions; a small set of versioned REST routes for machine clients (`/api/v1/evidence/ingest` reserved for v3 pipeline integration).
- **Database:** PostgreSQL. **ORM:** Drizzle — typed schema in source control, plain-SQL migrations readable line-by-line (auditor-friendly).
- **Auth:** Auth.js (NextAuth v5), credentials/email for v1; provider abstraction keeps SSO (Okta/Entra) a configuration change for any enterprise deployment.
- **File storage:** abstraction layer — local filesystem in dev/demo/live-local; S3-compatible driver swap for any hosted instance.
- **Evidence graph:** relational (typed link tables + recursive CTEs). No Neo4j at this scale.

```
priora/
├── src/
│   ├── app/            # Next.js App Router — pages + API routes
│   ├── modules/        # Domain modules — UI-agnostic, unit-testable pure logic
│   │   ├── lifecycle/  # Phases, gates, gate register
│   │   ├── risk/       # Risk register, 7-domain taxonomy
│   │   ├── controls/   # Control library, SoA
│   │   ├── evidence/   # Evidence locker, hashing, AEP generator
│   │   ├── audit/      # Append-only audit log
│   │   └── identity/   # Users, roles, RBAC
│   ├── db/             # Drizzle schema + migrations
│   └── lib/            # Shared utilities (zod schemas, framework mappings)
├── seed/               # demo + test fixture profiles
└── docs/               # ADRs, specs, RTM
```

**Architectural rule:** all governance logic (gate progression rules, hash verification, AEP assembly, RBAC decisions) lives in `modules/` as pure functions, testable without the web framework, traceable to requirements.

## 4. Data model

Schema vocabulary mirrors the playbook exactly.

**Core spine**
- `projects` — governed AI system: name, description, criticality, owner, current phase, status.
- `phases` — 6 per project (CPMAI I–VI: Business Understanding, Data Understanding, Data Preparation, Model Development, Model Evaluation, Operationalization), each with status + required-artifact checklist state.
- `gates` — one per phase: tri-state decision (**Approved / Conditionally Approved / Not Approved**), reviewer(s), decision date, conditions/corrective actions, sign-off actor + timestamp. **Gate Register** = view over this table matching Appendix B's summary sheet columns.

**Registers**
- `risks` — description, taxonomy domain (Technical / Ethical / Operational / Cybersecurity / Privacy / Regulatory / Mission-Driven), **3×3 likelihood × impact (Low/Moderate/High each axis** — consistent with the playbook's MRP High/Mod/Low convention**)**, treatment, owner, linked controls, status.
- `risk_acceptances` — residual-risk acceptance: rationale, accepting authority (Executive Sponsor), expiry/review date. Thin in v1; full workflow v2.
- `controls` — master library: ISO/IEC 42001 Annex A + selected NIST SP 800-53, each row carrying the book's triple mapping (ISO 42001 clause / AI RMF function / CSRMC element: MRP, AEP, CCV, RES, REC, TEL).
- `soa_entries` — per-project clone of the library: Applicable/N-A toggle + **mandatory** written justification + implementation status.

**Evidence chain**
- `evidence_artifacts` — file ref or JSON payload, artifact type (from the playbook's Appendix D catalog), phase, **SHA-256 hash computed server-side at ingest**, version, uploader, timestamp.
- `evidence_links` — typed edges: evidence→control, evidence→gate, evidence→risk. The Requirement→Control→Evidence→Hash traceability chain, relational.
- `aep_exports` — every generated package: manifest JSON snapshot, package hash, generated-by, timestamp. Exports are themselves evidence.

**Accountability**
- `users`, `roles`, `project_assignments` (who holds which governance function on which project — RACI-lite).
- `audit_log` — append-only: actor, action, entity, before/after diff, timestamp. **INSERT-only enforced at the database level** (no UPDATE/DELETE grants to the app role).

## 5. v1 functional behavior

- **Lifecycle Engine:** strict linear I→VI; no skipping; advancing requires current gate = Approved. **Conditionally Approved advances but auto-creates corrective-action items with due dates**, surfaced on the dashboard until closed. Gate sign-off restricted to Governance Lead / Executive Sponsor; captures actor, role, timestamp, rationale. Every transition audited.
- **Risk Register:** CRUD, 7 domains, 3×3 scoring, owner assignment, control linkage; per-project and portfolio filtering.
- **SoA:** project creation clones the control library. N/A toggle without justification = validation error (the book's rule, enforced).  SoA completeness % feeds the dashboard.
- **Evidence Locker:** upload file or JSON; select artifact type from catalog; link to controls/gates/risks. **Verify Integrity** action re-hashes and flags match/mismatch (tamper-detection demo).
- **AEP Generator:** one click per project → zip of all evidence + `manifest.json` (artifact inventory, hashes, framework triple-mappings, Gate Register snapshot, SoA snapshot), per the book's AEP Metadata Schema concept. Export logged and hashed.
- **Mission Dashboard:** portfolio grid — every project's phase, gate status, open risks by domain, SoA completeness, evidence count, pending corrective actions. One screen answers "where is everything?"
- **RBAC:** six v1 roles — Governance Lead, Executive Sponsor, Program Manager, ML Engineer, Risk Officer, **Auditor (read-only everything)**. Route- and action-level enforcement.
- **Seed profile:** three demo projects at different lifecycle phases with realistic risks, partial SoAs, and evidence, so first load tells a story.

## 6. Scope boundaries

- **v1 (MVP, above):** the decision/evidence layer — the soul of the playbook.
- **v2 (post-demo / internal-adoption case):** MRP wizard, full Risk Acceptance workflow, Reciprocity & Inheritance register, governance cadence calendar (weekly/bi-weekly/quarterly/annual reviews), Material Change Evaluation, maturity scoring (Stages 1–4), remaining 7 of the book's 13 roles.
- **v3 (future roadmap — documented, cited, not built):** CCV/ACVR rules engine, telemetry ingestion, incident ticketing, supplier & competency tracking. Rationale (Jerome's call, 2026-06-11): DoD/DoW CSRMC is an evolving framework not yet fully defined; v3 is captured as a cited roadmap section in the README mapping CSRMC elements (CCV, ACVR, TEL) so the project visibly tracks the frontier without building against an unfinished spec.

## 7. Repo & engineering standards (the portfolio layer)

- **Private GitHub repo `priora`** under Jerome's personal account — independently owned, travels with Jerome. Local path: `/Users/just_jerome/Desktop/My_PKA/PKM/01_Projects/priora-app/` (GitHub repo name `priora`; local folder differs because macOS APFS is case-insensitive and `priora/` would collide with the `Priora/` docs folder). The `Priora/` docs folder (this one) holds design specs and the local-only `archive/` of pre-Priora design history.
- **Branch protection on `main`:** PRs only, CI green required, no force-push. Feature-branch workflow even solo — the PR history demonstrates disciplined change control.
- **Signed commits** (SSH signing key; verified badge on every commit).
- **CI from commit #1** (GitHub Actions): typecheck, lint, unit tests, build, migration drift check. A failing gate blocks merge — the book's phase-gate philosophy applied to the codebase.
- **ADRs** in `docs/adr/`: ADR-0001 (monolith supersedes SDD microservices + Firebase pivot), ADR-0002 (stack selection), ADR for 3×3 risk matrix, and onward for every load-bearing decision.
- **RTM as code** (`docs/rtm.md`): requirement → module → test file. Tests named to requirements (e.g., `gate-progression.spec.ts` asserts FR-06 behavior). Carries forward the MTP's TC mapping where applicable (TC-005…TC-009 → M2 suite).
- **Security hygiene:** Dependabot, secret scanning, `SECURITY.md`, env-based config with `.env.example`, zero secrets in repo. Target: the repo survives Jerome auditing it against his own 2026-05-10 security baseline.
- **README as portfolio landing page:** screenshot, architecture diagram, the book linkage, demo URL, v1/v2/v3 roadmap with CSRMC futures cited.

## 8. Build plan — milestones

Each milestone ends runnable and demoable.

| # | Milestone | Done means |
|---|-----------|------------|
| M0 | Repo bootstrap — repo, Next.js scaffold, Drizzle + Postgres via Docker Compose, CI, branch protection, signed commits, ADR-0001/0002 | Green CI badge on an empty-but-governed repo |
| M1 | Foundation — full core-spine migration, Auth.js + 6 roles, RBAC middleware, append-only audit log (DB-level enforcement) | Users log in; every action audited; Auditor sees but can't touch |
| M2 | Lifecycle Engine — projects CRUD, phases, tri-state gates, corrective actions, Gate Register view | A project walks I→VI with enforced gates; M2 tests map to TC-005…TC-009 |
| M3 | Registers — risk register (3×3, 7 domains), control library seeded with triple mappings, SoA clone/toggle with mandatory justification | Governance posture fully describable in-app |
| M4 | Evidence & AEP — locker, SHA-256 at ingest, integrity re-verification, typed links, AEP zip + manifest | Tamper-detection demo and one-click audit package work |
| M5 | Mission Dashboard + seed — portfolio dashboard, 3 demo projects, UI polish | First load tells the story |
| M6 | Demo deployment — hosted demo (Vercel + Neon or Railway), scheduled seed reset, demo URL in README | Anyone can be sent a link |

**Sequencing rationale:** audit log and RBAC land first (M1) because retrofitting accountability is the failure pattern the book warns about — everything built after M1 is born governed.

## 9. Testing approach

- **Unit:** all `modules/` logic (gate rules, hash verify, AEP manifest assembly, RBAC decisions) — pure-function tests, requirement-named.
- **Integration:** DB-level behaviors that can't be unit-tested — audit-log INSERT-only enforcement, SoA clone batch, migration integrity.
- **E2E (Playwright):** the demo-critical paths — login per role, walk a gate, upload + verify evidence, generate AEP, dashboard render.
- Tests encode intent: each asserts a governance rule from the book/SRD, not incidental behavior.

## 10. Known risks / open items

- **Legacy spec drift:** SRD says 7 roles, book says 13, v1 implements 6 — the RTM records the mapping so nothing is silently dropped.
- **Control library seeding effort:** transcribing ISO 42001 Annex A + selected 800-53 with triple mappings is meticulous work; source from the book's Appendix C/D crosswalks. ISO text is licensed — store control IDs + paraphrased short titles + Jerome's mappings, not verbatim standard text, in the public-demo seed.
- **Missing folder:** legacy `index.md` references an "AI PM Command Center" spec subfolder not present in the archive folder — locate or note as lost before M0 (it may contain UI mockup ideas worth harvesting).
- **Name check:** "Priora" cleared a web search for software collisions (2026-06-11); a trademark-grade search was not performed and is out of scope for a portfolio project.
