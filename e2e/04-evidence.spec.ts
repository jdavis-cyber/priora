// E2E FR-13/FR-14: upload evidence and verify integrity — the hash computed at
// ingest matches a server-side re-hash. Runs as governance_lead (the only role
// besides ml_engineer holding evidence.verify; program_manager cannot verify).
import { expect, test } from "@playwright/test";
import { login, openProject, USERS } from "./helpers";

test("upload evidence and verify integrity OK", async ({ page }) => {
  await login(page, USERS.governance_lead);
  await openProject(page, "Sentinel");
  // Scope to main content — the sidebar's global Evidence link also matches
  await page.getByRole("main").getByRole("link", { name: /^evidence$/i }).click();
  await expect(page.getByRole("heading", { name: /evidence locker/i })).toBeVisible();

  // Upload via the M4 locker form
  await page.getByLabel(/artifact type/i).selectOption("meeting_minutes");
  await page.setInputFiles('input[type="file"]', {
    name: "e2e-minutes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("E2E gate-walk meeting minutes — fictional.", "utf8"),
  });
  await page.getByRole("button", { name: /ingest/i }).click();
  await expect(page.getByText("e2e-minutes.txt")).toBeVisible();

  // Verify integrity on the new artifact's row
  const row = page.locator("tr", { hasText: "e2e-minutes.txt" });
  await row.getByRole("button", { name: /verify/i }).click();
  await expect(row.getByText(/integrity verified/i)).toBeVisible();
  // "HASH MISMATCH" is the tamper banner; plain /tamper/i would false-positive
  // on control AU-9's title inside the row's link-editor options.
  await expect(row.getByText(/hash mismatch/i)).toHaveCount(0);
});
