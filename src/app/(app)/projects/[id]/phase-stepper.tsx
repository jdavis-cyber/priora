import { PHASE_NAMES } from "@/lib/phases";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export type StepperPhase = {
  phaseNumber: number;
  status: "not_started" | "in_progress" | "awaiting_gate" | "complete";
  gateDecision: "approved" | "conditionally_approved" | "not_approved" | null;
};

const STATUS_STYLES: Record<StepperPhase["status"], string> = {
  not_started: "border-zinc-700 bg-zinc-900 text-zinc-500",
  in_progress: "border-blue-500 bg-blue-600 text-white",
  awaiting_gate: "border-amber-500 bg-amber-500 text-white",
  complete: "border-emerald-500 bg-emerald-600 text-white",
};

const DECISION_LABELS: Record<string, { label: string; cls: string }> = {
  approved: { label: "Approved", cls: "text-emerald-400" },
  conditionally_approved: {
    label: "Conditionally approved",
    cls: "text-amber-400",
  },
  not_approved: { label: "Not approved", cls: "text-red-400" },
};

export function PhaseStepper({ phases }: { phases: StepperPhase[] }) {
  return (
    <ol className="flex w-full items-start">
      {phases.map((p, i) => {
        const decision = p.gateDecision
          ? DECISION_LABELS[p.gateDecision]
          : null;
        return (
          <li key={p.phaseNumber} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                className={`mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${STATUS_STYLES[p.status]}`}
                title={`${PHASE_NAMES[p.phaseNumber]} — ${p.status.replace("_", " ")}`}
                data-testid={
                  p.status === "in_progress" || p.status === "awaiting_gate"
                    ? "phase-step-current"
                    : undefined
                }
              >
                {ROMAN[i]}
              </div>
              {i < phases.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${p.status === "complete" ? "bg-emerald-600" : "bg-zinc-800"}`}
                />
              )}
            </div>
            <p className="mt-2 px-1 text-center text-xs font-medium text-zinc-300">
              {PHASE_NAMES[p.phaseNumber]}
            </p>
            <p
              className={`text-center text-xs ${decision?.cls ?? "text-zinc-600"}`}
            >
              {decision?.label ?? "Gate undecided"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
