// CPMAI I–VI mini-stepper for dashboard cards. Phases are integers 1..6
// (contract §1); roman numerals are display-only. Compact variant of the
// project-detail stepper — same status palette (blue = current).
const ROMAN = ["I", "II", "III", "IV", "V", "VI"] as const;

export function PhaseStepper({ currentPhase }: { currentPhase: number }) {
  return (
    <ol
      className="flex items-center gap-1"
      aria-label={`Phase ${ROMAN[currentPhase - 1]} of VI`}
    >
      {ROMAN.map((numeral, i) => {
        const phase = i + 1;
        const state =
          phase < currentPhase
            ? "done"
            : phase === currentPhase
              ? "current"
              : "todo";
        return (
          <li
            key={numeral}
            data-testid={state === "current" ? "phase-step-current" : undefined}
            className={
              "flex h-6 w-7 items-center justify-center rounded text-[11px] font-semibold " +
              (state === "done"
                ? "bg-zinc-700 text-zinc-100"
                : state === "current"
                  ? "bg-blue-600 text-white ring-2 ring-blue-400/40"
                  : "bg-zinc-900 text-zinc-600 ring-1 ring-inset ring-zinc-800")
            }
          >
            {numeral}
          </li>
        );
      })}
    </ol>
  );
}
