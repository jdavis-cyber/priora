// FR-09 — 3x3 likelihood x impact scoring per spec §4 (playbook MRP High/Mod/Low convention)
import { describe, expect, it } from "vitest";
import { riskBand, riskScore } from "./scoring";

describe("riskScore", () => {
  it("scores low=1, moderate=2, high=3 and multiplies the axes", () => {
    expect(riskScore("low", "low")).toBe(1);
    expect(riskScore("low", "moderate")).toBe(2);
    expect(riskScore("moderate", "low")).toBe(2);
    expect(riskScore("moderate", "moderate")).toBe(4);
    expect(riskScore("low", "high")).toBe(3);
    expect(riskScore("high", "low")).toBe(3);
    expect(riskScore("moderate", "high")).toBe(6);
    expect(riskScore("high", "moderate")).toBe(6);
    expect(riskScore("high", "high")).toBe(9);
  });

  it("only ever produces the six reachable 3x3 products", () => {
    const levels = ["low", "moderate", "high"] as const;
    const scores = new Set<number>();
    for (const l of levels) for (const i of levels) scores.add(riskScore(l, i));
    expect([...scores].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 6, 9]);
  });
});

describe("riskBand", () => {
  it("bands 1-2 low, 3-4 moderate, 6-9 high", () => {
    expect(riskBand(1)).toBe("low");
    expect(riskBand(2)).toBe("low");
    expect(riskBand(3)).toBe("moderate");
    expect(riskBand(4)).toBe("moderate");
    expect(riskBand(6)).toBe("high");
    expect(riskBand(9)).toBe("high");
  });

  it("rejects scores a 3x3 matrix cannot produce", () => {
    expect(() => riskBand(0)).toThrow();
    expect(() => riskBand(5)).toThrow();
    expect(() => riskBand(7)).toThrow();
    expect(() => riskBand(8)).toThrow();
    expect(() => riskBand(10)).toThrow();
  });
});
