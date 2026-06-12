// Gate tri-state chip (playbook Appendix B): the only saturated hues on the page
// besides the current-phase marker. null decision = current gate not yet reviewed.
type Decision = "approved" | "conditionally_approved" | "not_approved" | null;

const STYLES: Record<string, { label: string; cls: string }> = {
  approved: {
    label: "Approved",
    cls: "bg-emerald-950 text-emerald-400 ring-emerald-500/30",
  },
  conditionally_approved: {
    label: "Conditional",
    cls: "bg-amber-950 text-amber-400 ring-amber-500/30",
  },
  not_approved: {
    label: "Not approved",
    cls: "bg-red-950 text-red-400 ring-red-500/30",
  },
  undecided: {
    label: "Pending",
    cls: "bg-zinc-800 text-zinc-400 ring-zinc-600/30",
  },
};

export function GateChip({ decision }: { decision: Decision }) {
  const s = STYLES[decision ?? "undecided"];
  return (
    <span
      data-testid="gate-chip"
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
