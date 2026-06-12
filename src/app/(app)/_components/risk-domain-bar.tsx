// Compact 7-domain open-risk bar. Zinc-only (saturation is reserved for gate
// tri-state). Two-letter codes keep the row dense; full names ride the title attr.
import type { DomainCounts, RiskDomain } from "@/modules/dashboard/aggregate";
import { RISK_DOMAINS } from "@/modules/dashboard/aggregate";

const DOMAIN_META: Record<RiskDomain, { code: string; label: string }> = {
  technical: { code: "TE", label: "Technical" },
  ethical: { code: "ET", label: "Ethical" },
  operational: { code: "OP", label: "Operational" },
  cybersecurity: { code: "CY", label: "Cybersecurity" },
  privacy: { code: "PR", label: "Privacy" },
  regulatory: { code: "RE", label: "Regulatory" },
  mission_driven: { code: "MD", label: "Mission-Driven" },
};

export function RiskDomainBar({ counts }: { counts: DomainCounts }) {
  const total = RISK_DOMAINS.reduce((n, d) => n + counts[d], 0);
  return (
    <div className="flex items-center gap-2" data-testid="risk-domain-bar">
      <span className="text-2xl font-semibold tabular-nums text-zinc-100">
        {total}
      </span>
      <div className="flex gap-1">
        {RISK_DOMAINS.map((d) => {
          const n = counts[d];
          const meta = DOMAIN_META[d];
          return (
            <span
              key={d}
              title={`${meta.label}: ${n} open`}
              className={
                "flex h-6 min-w-7 items-center justify-center gap-0.5 rounded px-1 text-[10px] font-semibold " +
                (n === 0
                  ? "bg-zinc-900 text-zinc-700 ring-1 ring-inset ring-zinc-800"
                  : "bg-zinc-700 text-zinc-200")
              }
            >
              {meta.code}
              {n > 0 ? <span className="tabular-nums">{n}</span> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
