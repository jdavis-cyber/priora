// Guards the control library seed: counts, uniqueness, enum-valid triple mappings (spec §10).
import { describe, expect, it } from "vitest";
import { CONTROL_SEEDS } from "./controls";

describe("control library seed", () => {
  it("contains 38 ISO 42001 Annex A controls and 25 NIST 800-53 controls (63 total)", () => {
    expect(CONTROL_SEEDS.filter((c) => c.framework === "iso_42001")).toHaveLength(
      38,
    );
    expect(
      CONTROL_SEEDS.filter((c) => c.framework === "nist_800_53"),
    ).toHaveLength(25);
    expect(CONTROL_SEEDS).toHaveLength(63);
  });

  it("has a unique framework+ref pair per row (the upsert key)", () => {
    const keys = CONTROL_SEEDS.map((c) => `${c.framework}:${c.ref}`);
    expect(new Set(keys).size).toBe(CONTROL_SEEDS.length);
  });

  it("uses only contract-valid triple-mapping values", () => {
    const rmf = new Set(["govern", "map", "measure", "manage"]);
    const csrmc = new Set(["MRP", "AEP", "CCV", "RES", "REC", "TEL"]);
    for (const c of CONTROL_SEEDS) {
      expect(c.title.trim().length, `${c.ref} title`).toBeGreaterThan(0);
      if (c.aiRmfFunction !== null)
        expect(rmf.has(c.aiRmfFunction), `${c.ref} rmf`).toBe(true);
      if (c.csrmcElement !== null)
        expect(csrmc.has(c.csrmcElement), `${c.ref} csrmc`).toBe(true);
    }
  });

  it("covers every ISO 42001 Annex A family A.2 through A.10", () => {
    const families = new Set(
      CONTROL_SEEDS.filter((c) => c.framework === "iso_42001").map((c) =>
        c.ref.split(".").slice(0, 2).join("."),
      ),
    );
    for (const f of [
      "A.2",
      "A.3",
      "A.4",
      "A.5",
      "A.6",
      "A.7",
      "A.8",
      "A.9",
      "A.10",
    ]) {
      expect(families.has(f), `missing family ${f}`).toBe(true);
    }
  });
});
