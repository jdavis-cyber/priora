export type SoaPostureRow = {
  applicability: "applicable" | "not_applicable";
  implementationStatus:
    | "not_implemented"
    | "partially_implemented"
    | "implemented"
    | "inherited";
};

/** Percent (0-100, rounded) of SoA entries addressed: status beyond
 *  not_implemented, or consciously excluded as not_applicable. */
export function soaCompleteness(rows: SoaPostureRow[]): number {
  if (rows.length === 0) return 0;
  const addressed = rows.filter(
    (r) =>
      r.applicability === "not_applicable" ||
      r.implementationStatus !== "not_implemented",
  ).length;
  return Math.round((addressed / rows.length) * 100);
}

/** Family grouping key: "A.2" for ISO refs, "AC" for NIST refs. */
export function controlFamily(
  framework: "iso_42001" | "nist_800_53",
  ref: string,
): string {
  return framework === "iso_42001"
    ? ref.split(".").slice(0, 2).join(".")
    : ref.split("-")[0];
}
