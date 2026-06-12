// FR-01 — Mission Dashboard data source. Server-component-only module (reads).
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import {
  correctiveActions,
  evidenceArtifacts,
  gates,
  phases,
  projects,
  risks,
  soaEntries,
} from "@/db/schema";
import { soaCompleteness } from "@/modules/controls/completeness";
import {
  buildRollup,
  emptyDomainCounts,
  isOverdue,
  type PortfolioRollup,
  type ProjectSummaryRow,
  type RiskDomain,
} from "./aggregate";

export type PortfolioSummary = {
  rows: ProjectSummaryRow[];
  rollup: PortfolioRollup;
};

export async function portfolioSummary(db: Db, now: Date = new Date()): Promise<PortfolioSummary> {
  const projectRows = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "active"))
    .orderBy(projects.name);
  if (projectRows.length === 0) {
    return { rows: [], rollup: buildRollup([]) };
  }
  const ids = projectRows.map((p) => p.id);

  const phaseGateRows = await db
    .select({
      projectId: phases.projectId,
      phaseNumber: phases.phaseNumber,
      gateId: gates.id,
      decision: gates.decision,
    })
    .from(phases)
    .innerJoin(gates, eq(gates.phaseId, phases.id))
    .where(inArray(phases.projectId, ids));

  const openRiskRows = await db
    .select({ projectId: risks.projectId, domain: risks.domain })
    .from(risks)
    .where(and(inArray(risks.projectId, ids), eq(risks.status, "open")));

  const soaRows = await db
    .select({
      projectId: soaEntries.projectId,
      applicability: soaEntries.applicability,
      implementationStatus: soaEntries.implementationStatus,
    })
    .from(soaEntries)
    .where(inArray(soaEntries.projectId, ids));

  const evidenceRows = await db
    .select({ projectId: evidenceArtifacts.projectId })
    .from(evidenceArtifacts)
    .where(inArray(evidenceArtifacts.projectId, ids));

  const openActionRows = await db
    .select({
      projectId: phases.projectId,
      dueDate: correctiveActions.dueDate,
    })
    .from(correctiveActions)
    .innerJoin(gates, eq(correctiveActions.gateId, gates.id))
    .innerJoin(phases, eq(gates.phaseId, phases.id))
    .where(and(inArray(phases.projectId, ids), eq(correctiveActions.status, "open")));

  const rows: ProjectSummaryRow[] = projectRows.map((p) => {
    const currentGate = phaseGateRows.find(
      (g) => g.projectId === p.id && g.phaseNumber === p.currentPhase,
    );
    const domainCounts = emptyDomainCounts();
    for (const r of openRiskRows) {
      if (r.projectId === p.id) domainCounts[r.domain as RiskDomain] += 1;
    }
    const soa = soaRows.filter((s) => s.projectId === p.id);
    const actions = openActionRows.filter((a) => a.projectId === p.id);
    return {
      projectId: p.id,
      name: p.name,
      criticality: p.criticality,
      currentPhase: p.currentPhase,
      currentGateDecision: currentGate?.decision ?? null,
      openRiskCountByDomain: domainCounts,
      soaCompletenessPct: soaCompleteness(soa),
      evidenceCount: evidenceRows.filter((e) => e.projectId === p.id).length,
      openCorrectiveActionCount: actions.length,
      overdueCorrectiveActionCount: actions.filter((a) => isOverdue(a.dueDate, now)).length,
    };
  });

  return { rows, rollup: buildRollup(rows) };
}
