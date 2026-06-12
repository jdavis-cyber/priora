// FR-14 — canonical serialization so jsonb round-trips re-verify deterministically.
// Inline-JSON evidence is hashed at ingest, but Postgres jsonb does NOT preserve
// key order — re-verification must hash a canonical (recursively key-sorted) form.
import { describe, expect, it } from "vitest";
import { canonicalJson } from "./canonical-json";

describe("canonicalJson", () => {
  it("is invariant to object key order", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("sorts keys recursively in nested objects", () => {
    expect(canonicalJson({ z: { y: 1, x: 2 }, a: [{ c: 1, b: 2 }] })).toBe(
      '{"a":[{"b":2,"c":1}],"z":{"x":2,"y":1}}',
    );
  });

  it("preserves array element order", () => {
    expect(canonicalJson([3, 1, 2])).toBe("[3,1,2]");
  });

  it("handles primitives and null", () => {
    expect(canonicalJson(null)).toBe("null");
    expect(canonicalJson("x")).toBe('"x"');
    expect(canonicalJson(42)).toBe("42");
  });
});
