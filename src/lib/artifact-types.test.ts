// FR-13 — evidence carries an artifact type from the playbook's Appendix D catalog
import { describe, expect, it } from "vitest";
import { ARTIFACT_TYPES, isArtifactTypeId } from "./artifact-types";

describe("ARTIFACT_TYPES catalog", () => {
  it("has unique snake_case ids", () => {
    const ids = ARTIFACT_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it("has a non-empty label and a typicalPhase of 1..6 or null on every entry", () => {
    for (const t of ARTIFACT_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
      if (t.typicalPhase !== null) {
        expect(t.typicalPhase).toBeGreaterThanOrEqual(1);
        expect(t.typicalPhase).toBeLessThanOrEqual(6);
      }
    }
  });

  it("includes the load-bearing playbook artifacts and an 'other' escape hatch last", () => {
    const ids = ARTIFACT_TYPES.map((t) => t.id);
    for (const required of [
      "statement_of_applicability",
      "mission_risk_profile",
      "model_card",
      "gate_review_record",
      "risk_acceptance_record",
    ]) {
      expect(ids).toContain(required);
    }
    expect(ids[ids.length - 1]).toBe("other");
  });

  it("isArtifactTypeId guards correctly", () => {
    expect(isArtifactTypeId("model_card")).toBe(true);
    expect(isArtifactTypeId("nonsense_type")).toBe(false);
  });
});
