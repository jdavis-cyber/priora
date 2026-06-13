// M6: dual runtime profiles (spec §1 — decision "C, both by design").
// demo = public, seeded, resettable; live = local, real data.
// user.manage is blocked in demo so visitors cannot lock out the demo logins.
import { afterEach, describe, expect, it, vi } from "vitest";
import { appProfile, isActionBlockedInDemo, isDemo } from "./profile";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("runtime profile (M6)", () => {
  it("defaults to live when APP_PROFILE is unset or empty", () => {
    vi.stubEnv("APP_PROFILE", "");
    expect(appProfile()).toBe("live");
    expect(isDemo()).toBe(false);
  });

  it("recognizes the demo profile", () => {
    vi.stubEnv("APP_PROFILE", "demo");
    expect(appProfile()).toBe("demo");
    expect(isDemo()).toBe(true);
  });

  it("rejects unknown profiles loudly", () => {
    vi.stubEnv("APP_PROFILE", "staging");
    expect(() => appProfile()).toThrow(/Invalid APP_PROFILE/);
  });

  it("blocks user.manage in demo but nothing else", () => {
    vi.stubEnv("APP_PROFILE", "demo");
    expect(isActionBlockedInDemo("user.manage")).toBe(true);
    expect(isActionBlockedInDemo("gate.decide")).toBe(false);
  });

  it("blocks nothing in live", () => {
    vi.stubEnv("APP_PROFILE", "live");
    expect(isActionBlockedInDemo("user.manage")).toBe(false);
  });
});
