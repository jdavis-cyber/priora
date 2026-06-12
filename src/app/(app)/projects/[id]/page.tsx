import { asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { correctiveActions, gates, phases, projects } from "@/db/schema";
import { auth } from "@/lib/auth";
import { PHASE_NAMES } from "@/lib/phases";
import { can, type Role } from "@/modules/identity/rbac";
import { canDecideGate } from "@/modules/lifecycle/rules";
import { AdvancePhaseForm } from "./advance-phase-form";
import { type CaView, CorrectiveActionsList } from "./corrective-actions-list";
import { GateDecisionForm } from "./gate-decision-form";
import { PhaseStepper, type StepperPhase } from "./phase-stepper";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role as Role;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) notFound();

  const phaseRows = await db
    .select()
    .from(phases)
    .where(eq(phases.projectId, id))
    .orderBy(asc(phases.phaseNumber));
  const gateRows = await db
    .select()
    .from(gates)
    .where(
      inArray(
        gates.phaseId,
        phaseRows.map((p) => p.id),
      ),
    );
  const gateByPhaseId = new Map(gateRows.map((g) => [g.phaseId, g]));
  const caRows = await db
    .select()
    .from(correctiveActions)
    .where(
      inArray(
        correctiveActions.gateId,
        gateRows.map((g) => g.id),
      ),
    );

  const stepperPhases: StepperPhase[] = phaseRows.map((p) => ({
    phaseNumber: p.phaseNumber,
    status: p.status,
    gateDecision: gateByPhaseId.get(p.id)?.decision ?? null,
  }));

  const currentPhaseRow = phaseRows.find(
    (p) => p.phaseNumber === project.currentPhase,
  )!;
  const currentGate = gateByPhaseId.get(currentPhaseRow.id)!;

  const phaseLabelByGateId = new Map(
    phaseRows.map((p) => [
      gateByPhaseId.get(p.id)!.id,
      `Gate ${ROMAN[p.phaseNumber - 1]}`,
    ]),
  );
  const caViews: CaView[] = caRows.map((ca) => ({
    id: ca.id,
    description: ca.description,
    dueDate: ca.dueDate.toISOString(),
    status: ca.status,
    closedAt: ca.closedAt ? ca.closedAt.toISOString() : null,
    phaseLabel: phaseLabelByGateId.get(ca.gateId) ?? "—",
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="mt-1 text-sm text-zinc-400">{project.description}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Criticality: {project.criticality.replace("_", " ")} · Status:{" "}
            {project.status}
          </p>
        </div>
        <Link
          href={`/projects/${project.id}/gate-register`}
          className="rounded border border-zinc-700 px-3 py-2 text-sm font-medium text-blue-400 hover:bg-zinc-900"
        >
          Gate Register
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Lifecycle — CPMAI Phases I–VI
        </h2>
        <PhaseStepper phases={stepperPhases} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Current phase — {ROMAN[project.currentPhase - 1]}:{" "}
            {PHASE_NAMES[project.currentPhase]}
          </h2>
          {currentGate.decision ? (
            <p className="mb-3 text-sm">
              Gate decision:{" "}
              <span className="font-medium">
                {currentGate.decision.replace(/_/g, " ")}
              </span>
              {currentGate.rationale && ` — "${currentGate.rationale}"`}
            </p>
          ) : (
            <p className="mb-3 text-sm text-zinc-500">Gate not yet decided.</p>
          )}
          {can(role, "phase.advance") && (
            <AdvancePhaseForm
              projectId={project.id}
              isFinal={project.currentPhase >= 6}
            />
          )}
        </div>
        {canDecideGate(role) && (
          <GateDecisionForm
            gateId={currentGate.id}
            projectId={project.id}
            phaseLabel={`Phase ${ROMAN[project.currentPhase - 1]} (${PHASE_NAMES[project.currentPhase]})`}
          />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Corrective actions
        </h2>
        <CorrectiveActionsList
          items={caViews}
          projectId={project.id}
          canClose={can(role, "project.edit")}
        />
      </section>
    </div>
  );
}
