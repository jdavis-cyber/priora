import { describe, expect, it } from "vitest";
import { MAX_PHASE, MIN_PHASE, PHASE_NAMES } from "./phases";

// CPMAI phase naming per the playbook §2 — integers 1..6 everywhere,
// display names resolved only through this module.
describe("phases", () => {
  it("names all six CPMAI phases in order", () => {
    expect(PHASE_NAMES[1]).toBe("Business Understanding");
    expect(PHASE_NAMES[2]).toBe("Data Understanding");
    expect(PHASE_NAMES[3]).toBe("Data Preparation");
    expect(PHASE_NAMES[4]).toBe("Model Development");
    expect(PHASE_NAMES[5]).toBe("Model Evaluation");
    expect(PHASE_NAMES[6]).toBe("Operationalization");
  });

  it("bounds the phase range 1..6", () => {
    expect(MIN_PHASE).toBe(1);
    expect(MAX_PHASE).toBe(6);
    expect(Object.keys(PHASE_NAMES)).toHaveLength(6);
  });
});
