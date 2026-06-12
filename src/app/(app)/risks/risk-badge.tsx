import { riskBand, riskScore, type RatingLevel } from "@/modules/risk/scoring";

const BAND_CLASSES = {
  low: "bg-emerald-950 text-emerald-300",
  moderate: "bg-amber-950 text-amber-300",
  high: "bg-red-950 text-red-300",
} as const;

export function RiskBadge(props: {
  likelihood: RatingLevel;
  impact: RatingLevel;
}) {
  const score = riskScore(props.likelihood, props.impact);
  const band = riskBand(score);
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${BAND_CLASSES[band]}`}
    >
      {band.toUpperCase()} ({score})
    </span>
  );
}
