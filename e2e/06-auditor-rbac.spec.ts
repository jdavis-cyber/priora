// E2E (RBAC, spec §5): the Auditor sees everything and can mutate nothing.
// Two layers: (a) no gate-decision form is rendered; (b) a direct mutation
// attempt — submitting the REAL AEP-generate server action with auditor
// cookies (the form renders unconditionally; authorization lives in the
// action) — leaves the export list untouched. The LOAD-BEARING assertion is
// (b)'s state check: it fails if RBAC enforcement ever moves to render-time
// only. (Next.js 15 client-wrapped forms emit no $ACTION_ID hidden input, so
// the plan's header-forgery variant is replaced by replaying the real
// progressive-enhancement surface — same invariant under test.)
import { expect, test } from "@playwright/test";
import { login, openProject, USERS } from "./helpers";

test("auditor sees no gate form and a direct mutation is rejected", async ({ page }) => {
  await login(page, USERS.auditor);

  // (a) Render-level: no gate decision form, gate VI still undecided post-03
  await openProject(page, "Sentinel");
  const projectUrl = page.url();
  await expect(page.getByTestId("gate-decide-form")).toHaveCount(0);
  await expect(page.getByText(/gate not yet decided/i)).toBeVisible();

  // (b) Action-level: submit the real AEP-generate form as the auditor
  await page.goto(`${projectUrl}/aep`);
  await expect(page.getByRole("heading", { name: /aep exports/i })).toBeVisible();
  const zipLinks = page.getByRole("link", { name: /^zip$/i });
  const before = await zipLinks.count();
  expect(before).toBeGreaterThan(0); // seed + 05's export are present

  await page.getByRole("button", { name: /generate/i }).click();
  await page.waitForLoadState("networkidle");

  // State unchanged — the decisive check
  await page.reload();
  await expect(zipLinks).toHaveCount(before);

  // Gate still undecided too
  await page.goto(projectUrl);
  await expect(page.getByText(/gate not yet decided/i)).toBeVisible();
});
