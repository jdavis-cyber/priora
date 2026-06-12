// SoA completeness feeds the Mission Dashboard (spec §5): an entry counts as
// addressed when implementationStatus != not_implemented OR applicability = not_applicable.
import { describe, expect, it } from "vitest";
import { soaCompleteness } from "./completeness";

describe("soaCompleteness", () => {
  it("returns 0 for an empty SoA", () => {
    expect(soaCompleteness([])).toBe(0);
  });

  it("counts implemented, partial, inherited, and justified-N/A entries as addressed", () => {
    expect(
      soaCompleteness([
        { applicability: "applicable", implementationStatus: "implemented" }, // addressed
        {
          applicability: "applicable",
          implementationStatus: "partially_implemented",
        }, // addressed
        { applicability: "applicable", implementationStatus: "inherited" }, // addressed
        {
          applicability: "not_applicable",
          implementationStatus: "not_implemented",
        }, // addressed (N/A)
        {
          applicability: "applicable",
          implementationStatus: "not_implemented",
        }, // NOT addressed
      ]),
    ).toBe(80);
  });

  it("rounds to a whole percentage", () => {
    expect(
      soaCompleteness([
        { applicability: "applicable", implementationStatus: "implemented" },
        {
          applicability: "applicable",
          implementationStatus: "not_implemented",
        },
        {
          applicability: "applicable",
          implementationStatus: "not_implemented",
        },
      ]),
    ).toBe(33);
  });
});
