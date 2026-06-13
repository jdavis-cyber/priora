# Requirements Traceability Matrix

Requirement → implementing module → verifying test. Updated every PR that
touches a requirement. IDs carry over from SRD v3.0 (FR-xx) and MTP v1.0
(TC-xxx) where applicable; book-sourced rules cite the playbook section.

| Req | Source | Description | Module | Test | Status |
|---|---|---|---|---|---|
| M0-01 | Spec §7 | CI gates every merge (typecheck, lint, test, drift, build, secret scan) | `.github/workflows/ci.yml` | the pipeline itself | ✅ M0 |
| M0-02 | Spec §7 | Commits signed and verified | repo config + branch protection | `gh api .../commits/main --jq .commit.verification.verified` | ✅ M0 |
| M0-03 | Spec §7 | Schema changes require committed migrations | `db:check` script | CI drift step | ✅ M0 |
| FR-05 | SRD 3.2 | 6-phase CPMAI linear workflow enforcement | `modules/lifecycle` | `src/modules/lifecycle/rules.test.ts` (TC-005, TC-007), `src/modules/lifecycle/service.integration.test.ts`, `src/modules/lifecycle/phase-advance.integration.test.ts` (I→VI walk) | ✅ M2 |
| FR-06 | SRD 3.2 | Gate locking until authorized sign-off | `modules/lifecycle` | `src/modules/lifecycle/rules.test.ts` (TC-006, TC-008, TC-009), `src/modules/lifecycle/gate-decision.integration.test.ts` | ✅ M2 |
| FR-07 | SRD 3.2 | Material Change Evaluation (lifecycle re-entry on material change) | — | — | ⬜ v2 — deliberately deferred per spec §6; recorded here so the requirement is not silently dropped |
| FR-09 | SRD 3.3 | Risk register with control linkage | `modules/risk` | `src/modules/risk/scoring.test.ts` (3×3), `src/db/risk-actions.integration.test.ts` (CRUD + atomic link replacement), `src/db/risk-acceptance.integration.test.ts` | ✅ M3 |
| FR-10 | SRD 3.3 | SoA toggles with mandatory justification | `modules/controls` + `seed/controls.ts` (63 controls, triple-mapped) | `src/modules/controls/soa.test.ts` (N/A-needs-justification), `src/modules/controls/completeness.test.ts`, `seed/controls.test.ts`, `src/db/soa-clone.integration.test.ts`, `src/db/seed-controls.integration.test.ts` | ✅ M3 |
| FR-11 | SRD 3.3 | MRP wizard (mission risk profile questionnaire) | — | — | ⬜ v2 — deferred per spec §6; recorded so the requirement is not silently dropped |
| FR-12 | SRD 3.3 | Control inheritance registry (reciprocity) | — | — | ⬜ v2 — deferred per spec §6 |
| FR-13 | SRD 3.4 | Evidence artifacts with typed catalog, versioning, storage abstraction | `modules/evidence/ingest` + `lib/storage` + `lib/artifact-types` | `src/modules/evidence/ingest.test.ts`, `src/lib/storage.test.ts`, `src/lib/artifact-types.test.ts`, `src/modules/evidence/evidence.integration.test.ts` | ✅ M4 |
| FR-14 | SRD 3.4 | SHA-256 at ingest + tamper-detecting re-verification (canonical JSON for jsonb) | `modules/evidence/hash`, `canonical-json`, `verify` | `src/modules/evidence/hash.test.ts` (known vectors), `canonical-json.test.ts`, `evidence.integration.test.ts` (on-disk tamper flagged) | ✅ M4 |
| FR-15 | SRD 3.4 | Evidence traceability chain + AEP generation (zod-valid manifest, package hash) | `modules/evidence/aep`, `generate-aep`, `chain` | `src/modules/evidence/aep.test.ts`, `aep.integration.test.ts` (zip round-trip), `chain.integration.test.ts` | ✅ M4 |
| NFR-01 | SRD 5.1 | Append-only tamper-evident audit log | `modules/audit` + migration 0002 (`priora_app` role + trigger); read side: `modules/dashboard/audit-query`, `app/(app)/audit-log` | `src/modules/audit/append-only.integration.test.ts` (5 assertions, both layers) + `src/modules/audit/record.test.ts`; `audit-query.integration.test.ts` (filters + no-skip/no-overlap keyset paging) | ✅ M1/M5 — M5 adds the read-side browsing UI |
| M1-01 | Contract §3 | RBAC matrix — auditor provably read-only | `modules/identity/rbac` | `src/modules/identity/rbac.test.ts` (exhaustive role×action sweep) | ✅ M1 |
| M1-02 | Spec §5 | Credentials auth, JWT sessions carrying id+role, audited sign-in | `lib/auth*`, `middleware` | scripted login smoke (M1 Task 8) + `auth.login` audit row | ✅ M1 |
| FR-01 | SRD 3.1 | Portfolio dashboard: phase + gate status of all projects | `modules/dashboard`, `app/(app)/page.tsx` | `aggregate.test.ts`, `queries.integration.test.ts`, `e2e/02-dashboard.spec.ts` | ✅ M5 |
| FR-02 | SRD 3.1 | Per-project drill-down views | `app/(app)/projects/[id]/*` (M2–M4 pages) | `e2e/03-gate-walk.spec.ts` | 🟡 Partial — dashboard cards link to the M2–M4 project pages (lifecycle, SoA, evidence, AEP); a dedicated per-project analytics dashboard is not built in v1 |
| FR-03 | SRD 3.1 | Performance/KPI monitoring views | — | — | ⬜ v3 — bias/drift KPIs deferred: telemetry ingestion and CCV-driven KPIs track the DoD CSRMC roadmap (spec §6); v1 surfaces governance KPIs only (SoA %, open risks, corrective actions) |
| M5-01 | Spec §5 | Demo seed: 3 storytelling projects, verifiable evidence hashes | `seed/demo.ts`, `seed/demo-data.ts` | seed partition assertions + `e2e/04-evidence.spec.ts` | ✅ M5 |
| M5-02 | Spec §9 | E2E coverage of demo-critical paths, CI-enforced | `e2e/*`, `.github/workflows/ci.yml` (`e2e` job) | the suite itself — 7 tests, runs on every PR (required-status-check API returns 403 on the free private-repo plan, so `e2e` gates by the same convention as `ci`) | ✅ M5 |
| AI-297 | Playbook App. C | 10 flagged control triple-mappings verified against Appendix C crosswalks | `seed/controls.ts` | `seed/controls.test.ts` + per-row rationale comments; merged #49 | ✅ M6 |
| M6-01 | Spec §1 | Dual runtime profiles (demo\|live); demo blocks `user.manage` | `src/lib/profile.ts` | `src/lib/profile.test.ts` | ✅ M6 |
| M6-02 | Spec §8 M6 | Storage driver selectable (local\|vercel_blob) for ephemeral-fs host | `src/lib/storage.ts`, `src/lib/storage-vercel-blob.ts` | `src/lib/storage-select.test.ts` | ✅ M6 |
| M6-03 | Spec §8 M6 | Hosted demo on Vercel + Neon (ADR-0003) | infra + `docs/adr/0003-demo-hosting-vercel-neon.md` | verified live: curl smoke (root 200/`Priora`, `/login` 200, banner) + scripted browser login renders seeded dashboard | ✅ M6 |
| M6-04 | Spec §8 M6 | Daily seed reset incl. Blob evidence bytes | `.github/workflows/demo-reset.yml` | reset command proven manually (27 artifacts re-seeded into Blob via the exact cron command); scheduled trigger goes live when GitHub Actions minutes reset | 🟡 M6 — workflow committed, automatic schedule not yet fired (Actions quota exhausted this cycle) |
| M6-05 | Spec §7 | README as portfolio landing page (URL, creds, badge, screenshot) | `README.md` | visual review + deployed screenshot `docs/assets/dashboard.png` | ✅ M6 |
