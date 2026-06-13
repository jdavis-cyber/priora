// Runtime profile: demo (public, seeded, resettable) vs live (local, private).
// Spec §1; M6. Read lazily so vi.stubEnv works and Vercel env injection is honored.
const VALID_PROFILES = ["demo", "live"] as const;
export type AppProfile = (typeof VALID_PROFILES)[number];

export function appProfile(): AppProfile {
  const raw = process.env.APP_PROFILE || "live";
  if (!(VALID_PROFILES as readonly string[]).includes(raw)) {
    throw new Error(`Invalid APP_PROFILE: "${raw}" (expected demo|live)`);
  }
  return raw as AppProfile;
}

export function isDemo(): boolean {
  return appProfile() === "demo";
}

// Actions disabled on the public demo regardless of role.
const DEMO_BLOCKED_ACTIONS = new Set<string>(["user.manage"]);

export function isActionBlockedInDemo(action: string): boolean {
  return isDemo() && DEMO_BLOCKED_ACTIONS.has(action);
}
