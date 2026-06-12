import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  // Stateful, ordered suite against one seeded DB: 01→06, single worker.
  fullyParallel: false,
  workers: 1,
  retries: 0, // a flaky governance demo is a failing governance demo — fix, don't retry
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
