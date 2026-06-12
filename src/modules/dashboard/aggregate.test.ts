// FR-01 — Mission Dashboard portfolio aggregates (spec §5: "One screen answers
// 'where is everything?'"). These pure helpers encode WHAT counts as open/pending/
// overdue, so the dashboard's numbers are governance rules, not view-layer accidents.
import { describe, expect, it } from "vitest";
import {
  buildRollup,
  emptyDomainCounts,
  isOverdue,
  RISK_DOMAINS,
  tallyDomains,
  type ProjectSummaryRow,
} from "./aggregate";

const row = (over: Partial<ProjectSummaryRow>): ProjectSummaryRow => ({
  projectId: "p",
  name: "P",
  criticality: "medium",
  currentPhase: 1,
  currentGateDecision: null,
  openRiskCountByDomain: emptyDomainCounts(),
  soaCompletenessPct: 0,
  evidenceCount: 0,
  openCorrectiveActionCount: 0,
  overdueCorrectiveActionCount: 0,
  ...over,
});

describe("RISK_DOMAINS", () => {
  it("is the playbook's 7-domain taxonomy in contract order", () => {
    expect(RISK_DOMAINS).toEqual([
      "technical",
      "ethical",
      "operational",
      "cybersecurity",
      "privacy",
      "regulatory",
      "mission_driven",
    ]);
  });
});

describe("tallyDomains", () => {
  it("counts occurrences per domain and zero-fills the rest", () => {
    const t = tallyDomains(["technical", "privacy", "technical"]);
    expect(t.technical).toBe(2);
    expect(t.privacy).toBe(1);
    expect(t.ethical).toBe(0);
    expect(Object.keys(t)).toHaveLength(7);
  });
});

describe("isOverdue", () => {
  it("is overdue strictly after the due date", () => {
    const now = new Date("2026-06-11T12:00:00Z");
    expect(isOverdue(new Date("2026-06-10T00:00:00Z"), now)).toBe(true);
    expect(isOverdue(new Date("2026-06-12T00:00:00Z"), now)).toBe(false);
  });
});

describe("buildRollup", () => {
  it("totals projects, phase distribution, open risks by domain, pending gates, overdue actions", () => {
    const rows: ProjectSummaryRow[] = [
      row({
        projectId: "a",
        currentPhase: 5,
        currentGateDecision: null, // current gate undecided => pending
        openRiskCountByDomain: { ...emptyDomainCounts(), technical: 2, privacy: 1 },
        overdueCorrectiveActionCount: 1,
      }),
      row({
        projectId: "b",
        currentPhase: 2,
        currentGateDecision: null,
        openRiskCountByDomain: { ...emptyDomainCounts(), technical: 1 },
      }),
      row({
        projectId: "c",
        currentPhase: 6,
        currentGateDecision: "approved", // decided => not pending
      }),
    ];
    const r = buildRollup(rows);
    expect(r.totalProjects).toBe(3);
    expect(r.byPhase).toEqual({ 1: 0, 2: 1, 3: 0, 4: 0, 5: 1, 6: 1 });
    expect(r.openRisksByDomain.technical).toBe(3);
    expect(r.openRisksByDomain.privacy).toBe(1);
    expect(r.pendingGates).toBe(2);
    expect(r.overdueActions).toBe(1);
  });
});
