// FR-01 — pure portfolio aggregation rules. No DB, no framework imports.

export const RISK_DOMAINS = [
  "technical",
  "ethical",
  "operational",
  "cybersecurity",
  "privacy",
  "regulatory",
  "mission_driven",
] as const;
export type RiskDomain = (typeof RISK_DOMAINS)[number];
export type DomainCounts = Record<RiskDomain, number>;

export type ProjectSummaryRow = {
  projectId: string;
  name: string;
  criticality: "low" | "medium" | "high" | "mission_critical";
  currentPhase: number; // 1..6
  currentGateDecision: "approved" | "conditionally_approved" | "not_approved" | null;
  openRiskCountByDomain: DomainCounts;
  soaCompletenessPct: number; // 0..100
  evidenceCount: number;
  openCorrectiveActionCount: number;
  overdueCorrectiveActionCount: number;
};

export type PortfolioRollup = {
  totalProjects: number;
  byPhase: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
  openRisksByDomain: DomainCounts;
  pendingGates: number; // active projects whose CURRENT phase gate has no decision
  overdueActions: number;
};

export function emptyDomainCounts(): DomainCounts {
  return Object.fromEntries(RISK_DOMAINS.map((d) => [d, 0])) as DomainCounts;
}

export function tallyDomains(domains: RiskDomain[]): DomainCounts {
  const counts = emptyDomainCounts();
  for (const d of domains) counts[d] += 1;
  return counts;
}

/** Overdue = due date strictly in the past (open actions only — caller filters status). */
export function isOverdue(dueDate: Date, now: Date): boolean {
  return dueDate.getTime() < now.getTime();
}

export function buildRollup(rows: ProjectSummaryRow[]): PortfolioRollup {
  const byPhase: PortfolioRollup["byPhase"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const openRisksByDomain = emptyDomainCounts();
  let pendingGates = 0;
  let overdueActions = 0;
  for (const r of rows) {
    byPhase[r.currentPhase as 1 | 2 | 3 | 4 | 5 | 6] += 1;
    for (const d of RISK_DOMAINS) openRisksByDomain[d] += r.openRiskCountByDomain[d];
    if (r.currentGateDecision === null) pendingGates += 1;
    overdueActions += r.overdueCorrectiveActionCount;
  }
  return {
    totalProjects: rows.length,
    byPhase,
    openRisksByDomain,
    pendingGates,
    overdueActions,
  };
}
