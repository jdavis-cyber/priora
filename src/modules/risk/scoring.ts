// FR-09 — pure 3x3 scoring. Framework-free per the architectural rule (spec §3).
export type RatingLevel = "low" | "moderate" | "high";
export type RiskBand = "low" | "moderate" | "high";

const LEVEL_VALUE: Record<RatingLevel, 1 | 2 | 3> = {
  low: 1,
  moderate: 2,
  high: 3,
};

const REACHABLE_SCORES = new Set([1, 2, 3, 4, 6, 9]);

/** Product of the two axes: 1..9 on a 3x3 matrix (5, 7, 8 unreachable). */
export function riskScore(
  likelihood: RatingLevel,
  impact: RatingLevel,
): number {
  return LEVEL_VALUE[likelihood] * LEVEL_VALUE[impact];
}

/** Band per the 3x3 decision: 1-2 low, 3-4 moderate, 6-9 high. */
export function riskBand(score: number): RiskBand {
  if (!REACHABLE_SCORES.has(score)) {
    throw new Error(`riskBand: ${score} is not a reachable 3x3 score`);
  }
  if (score <= 2) return "low";
  if (score <= 4) return "moderate";
  return "high";
}
