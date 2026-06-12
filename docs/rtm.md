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
| FR-13/14 | SRD 3.4 | Evidence ingest with SHA-256 integrity | `modules/evidence` (M4) | — | ⬜ M4 |
| FR-15 | SRD 3.4 | Evidence traceability chain | `modules/evidence` (M4) | — | ⬜ M4 |
| NFR-01 | SRD 5.1 | Append-only tamper-evident audit log | `modules/audit` + migration 0002 (`priora_app` role + trigger) | `src/modules/audit/append-only.integration.test.ts` (5 assertions, both layers) + `src/modules/audit/record.test.ts` | ✅ M1 |
| M1-01 | Contract §3 | RBAC matrix — auditor provably read-only | `modules/identity/rbac` | `src/modules/identity/rbac.test.ts` (exhaustive role×action sweep) | ✅ M1 |
| M1-02 | Spec §5 | Credentials auth, JWT sessions carrying id+role, audited sign-in | `lib/auth*`, `middleware` | scripted login smoke (M1 Task 8) + `auth.login` audit row | ✅ M1 |
| FR-01 | SRD 3.1 | Portfolio dashboard: phase + gate status of all projects | `app/(dashboard)` (M5) | — | ⬜ M5 |
