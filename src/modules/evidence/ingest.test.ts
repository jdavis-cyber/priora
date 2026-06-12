// FR-13 — deterministic storage layout and version rule (same project+type+fileName => max+1)
import { describe, expect, it } from "vitest";
import { evidenceStoragePath, MAX_UPLOAD_BYTES, resolveVersion } from "./ingest";

describe("evidenceStoragePath", () => {
  it("builds the contract layout projects/{projectId}/phase_{n}/{evidenceId}/{fileName}", () => {
    expect(evidenceStoragePath("p-1", 3, "e-9", "model_card.pdf")).toBe(
      "projects/p-1/phase_3/e-9/model_card.pdf",
    );
  });
});

describe("resolveVersion", () => {
  it("starts at 1 when no prior version exists", () => {
    expect(resolveVersion(null)).toBe(1);
  });
  it("returns max+1 when versions exist", () => {
    expect(resolveVersion(4)).toBe(5);
  });
});

describe("MAX_UPLOAD_BYTES", () => {
  it("is the documented 25 MB limit", () => {
    expect(MAX_UPLOAD_BYTES).toBe(25 * 1024 * 1024);
  });
});
