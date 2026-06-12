// FR-15 — AEP manifest assembly: deterministic, complete, schema-valid
import { describe, expect, it } from "vitest";
import { buildAepManifest, type AepBuildInput } from "./aep";
import { aepManifestSchema } from "./aep-schema";

const input: AepBuildInput = {
  project: { id: "11111111-1111-4111-8111-111111111111", name: "Lliam" },
  generatedBy: "22222222-2222-4222-8222-222222222222",
  generatedAt: "2026-06-11T12:00:00.000Z",
  evidence: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      artifactType: "evaluation_report",
      fileName: "eval.pdf",
      sha256: "a".repeat(64),
      version: 2,
      phaseNumber: 5,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      artifactType: "mission_risk_profile",
      fileName: null,
      sha256: "b".repeat(64),
      version: 1,
      phaseNumber: 1,
    },
  ],
  links: [
    {
      evidenceId: "44444444-4444-4444-8444-444444444444",
      targetType: "control",
      targetId: "55555555-5555-4555-8555-555555555555",
      ref: "A.6.2",
    },
    {
      evidenceId: "44444444-4444-4444-8444-444444444444",
      targetType: "gate",
      targetId: "66666666-6666-4666-8666-666666666666",
    },
  ],
  gateRegister: [{ phaseNumber: 1, decision: "approved" }],
  soaSnapshot: [{ ref: "A.6.2", applicability: "applicable" }],
};

describe("buildAepManifest", () => {
  it("produces a schemaVersion-1 manifest carrying project, snapshots, and entries", () => {
    const m = buildAepManifest(input);
    expect(m.schemaVersion).toBe(1);
    expect(m.projectId).toBe(input.project.id);
    expect(m.projectName).toBe("Lliam");
    expect(m.generatedAt).toBe("2026-06-11T12:00:00.000Z");
    expect(m.generatedBy).toBe(input.generatedBy);
    expect(m.gateRegister).toEqual(input.gateRegister);
    expect(m.soaSnapshot).toEqual(input.soaSnapshot);
    expect(m.entries).toHaveLength(2);
  });

  it("groups links under their evidence entry, preserving optional refs", () => {
    const m = buildAepManifest(input);
    const evalEntry = m.entries.find(
      (e) => e.artifactType === "evaluation_report",
    )!;
    expect(evalEntry.links).toEqual([
      {
        targetType: "control",
        targetId: "55555555-5555-4555-8555-555555555555",
        ref: "A.6.2",
      },
      { targetType: "gate", targetId: "66666666-6666-4666-8666-666666666666" },
    ]);
    const mrpEntry = m.entries.find(
      (e) => e.artifactType === "mission_risk_profile",
    )!;
    expect(mrpEntry.links).toEqual([]);
  });

  it("orders entries deterministically (phase, then type, then version)", () => {
    const m = buildAepManifest(input);
    expect(m.entries.map((e) => e.artifactType)).toEqual([
      "mission_risk_profile",
      "evaluation_report",
    ]);
  });

  it("validates against the zod AepManifest schema", () => {
    expect(() => aepManifestSchema.parse(buildAepManifest(input))).not.toThrow();
  });

  it("rejects a tampered manifest via the schema (bad sha256)", () => {
    const m = buildAepManifest(input);
    m.entries[0].sha256 = "NOT-A-HASH";
    expect(() => aepManifestSchema.parse(m)).toThrow();
  });
});
