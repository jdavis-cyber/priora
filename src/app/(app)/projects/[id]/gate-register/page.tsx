import { asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  correctiveActions,
  gates,
  phases,
  projects,
  users,
} from "@/db/schema";
import { PHASE_NAMES } from "@/lib/phases";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const DECISION_LABELS: Record<string, { label: string; cls: string }> = {
  approved: { label: "Approved", cls: "text-emerald-400" },
  conditionally_approved: {
    label: "Conditionally Approved",
    cls: "text-amber-400",
  },
  not_approved: { label: "Not Approved", cls: "text-red-400" },
};

export default async function GateRegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const reviewerIds = gateRows
    .map((g) => g.decidedById)
    .filter((x): x is string => x !== null);
  const reviewers =
    reviewerIds.length > 0
      ? await db.select().from(users).where(inArray(users.id, reviewerIds))
      : [];
  const reviewerById = new Map(reviewers.map((u) => [u.id, u]));

  const caRows = await db
    .select()
    .from(correctiveActions)
    .where(
      inArray(
        correctiveActions.gateId,
        gateRows.map((g) => g.id),
      ),
    );
  const casByGateId = new Map<string, typeof caRows>();
  for (const ca of caRows) {
    const list = casByGateId.get(ca.gateId) ?? [];
    list.push(ca);
    casByGateId.set(ca.gateId, list);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-blue-400 hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-1 text-xl font-semibold">Gate Register</h1>
        <p className="text-sm text-zinc-500">
          Phase-gate decision summary (playbook Appendix B)
        </p>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="px-3 py-2">Gate</th>
            <th className="px-3 py-2">Phase</th>
            <th className="px-3 py-2">Date Reviewed</th>
            <th className="px-3 py-2">Decision</th>
            <th className="px-3 py-2">Reviewer</th>
            <th className="px-3 py-2">Corrective Actions Required</th>
            <th className="px-3 py-2">Completion Date</th>
          </tr>
        </thead>
        <tbody>
          {phaseRows.map((phase) => {
            const gate = gateByPhaseId.get(phase.id)!;
            const decision = gate.decision
              ? DECISION_LABELS[gate.decision]
              : null;
            const reviewer = gate.decidedById
              ? reviewerById.get(gate.decidedById)
              : null;
            const cas = casByGateId.get(gate.id) ?? [];
            const allClosed =
              cas.length > 0 && cas.every((ca) => ca.status === "closed");
            const completionDate = allClosed
              ? new Date(
                  Math.max(...cas.map((ca) => ca.closedAt!.getTime())),
                ).toLocaleDateString()
              : null;
            return (
              <tr key={gate.id} className="border-b border-zinc-800 align-top">
                <td className="px-3 py-2 font-medium">
                  Gate {ROMAN[phase.phaseNumber - 1]}
                </td>
                <td className="px-3 py-2">{PHASE_NAMES[phase.phaseNumber]}</td>
                <td className="px-3 py-2">
                  {gate.decidedAt ? gate.decidedAt.toLocaleDateString() : "—"}
                </td>
                <td
                  className={`px-3 py-2 font-medium ${decision?.cls ?? "text-zinc-500"}`}
                >
                  {decision?.label ?? "Pending"}
                </td>
                <td className="px-3 py-2">{reviewer?.name ?? "—"}</td>
                <td className="px-3 py-2">
                  {cas.length === 0 ? (
                    "None"
                  ) : (
                    <ul className="list-inside list-disc">
                      {cas.map((ca) => (
                        <li key={ca.id}>
                          {ca.description}{" "}
                          <span className="text-xs text-zinc-500">
                            ({ca.status})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-3 py-2">{completionDate ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
