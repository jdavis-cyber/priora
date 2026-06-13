// M6: Vercel's filesystem is ephemeral — demo evidence must live in Vercel Blob.
// Driver selection is env-driven so demo/live differ by configuration only (ADR-0003).
import { describe, expect, it } from "vitest";
import { selectStorage } from "./storage";

describe("storage driver selection (M6)", () => {
  it("returns a working Storage for 'local'", () => {
    const s = selectStorage("local");
    expect(typeof s.put).toBe("function");
    expect(typeof s.get).toBe("function");
    expect(typeof s.delete).toBe("function");
  });

  it("returns a Storage for 'vercel_blob' without needing a token to construct", () => {
    // Token is read lazily inside each call, so construction must not throw.
    const s = selectStorage("vercel_blob");
    expect(typeof s.put).toBe("function");
    expect(typeof s.get).toBe("function");
    expect(typeof s.delete).toBe("function");
  });

  it("rejects unknown drivers loudly", () => {
    expect(() => selectStorage("s3")).toThrow(/Unknown STORAGE_DRIVER/);
  });
});
