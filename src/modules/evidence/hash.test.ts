// FR-14 — SHA-256 evidence integrity: hash computed server-side, lowercase hex
import { describe, expect, it } from "vitest";
import { computeSha256 } from "./hash";

describe("computeSha256", () => {
  it("matches the known vector for 'abc'", () => {
    expect(computeSha256("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("matches the known vector for the empty string", () => {
    expect(computeSha256("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("hashes Buffer and string input identically", () => {
    expect(computeSha256(Buffer.from("abc", "utf8"))).toBe(
      computeSha256("abc"),
    );
  });

  it("always returns 64 lowercase hex chars", () => {
    expect(computeSha256("Priora")).toMatch(/^[0-9a-f]{64}$/);
  });
});
