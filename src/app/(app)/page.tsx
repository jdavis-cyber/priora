// FR-01 — Mission Dashboard: "One screen answers 'where is everything?'" (spec §5).
// Pure server component; reads via portfolioSummary only.
import Link from "next/link";
import { db } from "@/db";
import { portfolioSummary } from "@/modules/dashboard/queries";
import { GateChip } from "./_components/gate-chip";
import { PhaseStepper } from "./_components/phase-stepper";
import { RiskDomainBar } from "./_components/risk-domain-bar";
import { StatCard } from "./_components/stat-card";

export const dynamic = "force-dynamic";

const CRITICALITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  mission_critical: "Mission critical",
};

export default async function DashboardPage() {
  const { rows, rollup } = await portfolioSummary(db);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Mission Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Lifecycle position, gate posture, and risk exposure across every
          governed AI project.
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        data-testid="rollup-strip"
      >
        <StatCard label="Governed projects" value={rollup.totalProjects} />
        <StatCard
          label="Pending gates"
          value={rollup.pendingGates}
          sub="current-phase gates awaiting decision"
        />
        <StatCard
          label="Open risks"
          value={Object.values(rollup.openRisksByDomain).reduce(
            (a, b) => a + b,
            0,
          )}
          sub="across 7 taxonomy domains"
        />
        <StatCard
          label="Overdue corrective actions"
          value={rollup.overdueActions}
          tone={rollup.overdueActions > 0 ? "alert" : "neutral"}
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
          <p className="text-sm font-medium text-zinc-100">
            No governed projects yet
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Create a project to start its lifecycle at Phase I — Business
            Understanding.
          </p>
          <Link
            href="/projects"
            className="mt-4 inline-block rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
          >
            Go to Projects
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((p) => (
            <li
              key={p.projectId}
              data-testid="project-card"
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/projects/${p.projectId}`}
                    className="text-base font-semibold text-zinc-100 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400">
                    {CRITICALITY_LABEL[p.criticality]}
                  </span>
                  {p.overdueCorrectiveActionCount > 0 ? (
                    <span
                      data-testid="overdue-badge"
                      className="inline-flex items-center rounded-full bg-red-950 px-2.5 py-0.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/30"
                    >
                      {p.overdueCorrectiveActionCount} overdue action
                      {p.overdueCorrectiveActionCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-4">
                  <PhaseStepper currentPhase={p.currentPhase} />
                  <GateChip decision={p.currentGateDecision} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-zinc-800 pt-4 sm:grid-cols-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Open risks by domain
                  </div>
                  <div className="mt-1.5">
                    <RiskDomainBar counts={p.openRiskCountByDomain} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    SoA completeness
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-2xl font-semibold tabular-nums text-zinc-100">
                      {p.soaCompletenessPct}%
                    </span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-zinc-300"
                        style={{ width: `${p.soaCompletenessPct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Evidence artifacts
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums text-zinc-100">
                      {p.evidenceCount}
                    </span>
                    {p.openCorrectiveActionCount > 0 ? (
                      <span className="text-xs text-zinc-500">
                        · {p.openCorrectiveActionCount} open corrective action
                        {p.openCorrectiveActionCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
