// E2E FR-15: one-click AEP — generation succeeds and the package downloads as
// a zip (HTTP 200, application/zip).
import { expect, test } from "@playwright/test";
import { login, openProject, USERS } from "./helpers";

test("generate an AEP and download the zip", async ({ page }) => {
  await login(page, USERS.governance_lead);
  await openProject(page, "Sentinel");
  // AEP exports hang off the Evidence Locker
  await page.getByRole("main").getByRole("link", { name: /^evidence$/i }).click();
  await page.getByRole("link", { name: /aep exports/i }).click();
  await expect(page.getByRole("heading", { name: /aep exports/i })).toBeVisible();

  // Seed already holds 1 prior export; generate a fresh one
  await page.getByRole("button", { name: /generate/i }).click();
  const downloadLinks = page.getByRole("link", { name: /^zip$/i });
  await expect(downloadLinks.first()).toBeVisible();
  await expect(downloadLinks.nth(1)).toBeVisible(); // prior seed export + the fresh one

  const href = await downloadLinks.first().getAttribute("href");
  expect(href).toMatch(/^\/api\/aep\//);

  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/zip");
  expect((await res.body()).length).toBeGreaterThan(0);
});
