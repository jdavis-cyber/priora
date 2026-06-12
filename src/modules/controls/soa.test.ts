// FR-10 — the book's rule: marking a control not_applicable without a written
// justification is a validation error. This is the mandatory-justification gate.
import { describe, expect, it } from "vitest";
import { validateSoaEntry } from "./soa";

describe("validateSoaEntry", () => {
  it("accepts applicable entries with or without justification", () => {
    expect(
      validateSoaEntry({ applicability: "applicable", justification: "" }),
    ).toEqual({ ok: true });
    expect(
      validateSoaEntry({ applicability: "applicable", justification: "covered" }),
    ).toEqual({ ok: true });
  });

  it("rejects not_applicable with an empty justification", () => {
    expect(
      validateSoaEntry({ applicability: "not_applicable", justification: "" }),
    ).toEqual({
      ok: false,
      reason: "justification_required",
    });
  });

  it("rejects whitespace-only justification (no gaming the rule)", () => {
    expect(
      validateSoaEntry({
        applicability: "not_applicable",
        justification: "   \n\t",
      }),
    ).toEqual({
      ok: false,
      reason: "justification_required",
    });
  });

  it("accepts not_applicable with a real justification", () => {
    expect(
      validateSoaEntry({
        applicability: "not_applicable",
        justification: "No third-party suppliers in scope.",
      }),
    ).toEqual({ ok: true });
  });
});
