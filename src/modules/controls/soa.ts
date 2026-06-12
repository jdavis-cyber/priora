// FR-10 — pure SoA validation. Framework-free per the architectural rule.
export function validateSoaEntry(e: {
  applicability: "applicable" | "not_applicable";
  justification: string;
}): { ok: true } | { ok: false; reason: "justification_required" } {
  if (
    e.applicability === "not_applicable" &&
    e.justification.trim().length === 0
  ) {
    return { ok: false, reason: "justification_required" };
  }
  return { ok: true };
}
