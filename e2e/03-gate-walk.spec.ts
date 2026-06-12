// E2E FR-05/FR-06: decide Sentinel's Phase V Go/No-Go gate (approved) and
// advance to Phase VI; the Mission Dashboard reflects the transition.
// STATEFUL: later specs see Sentinel at VI. Reseed (--profile demo) to re-run.
import { expect, test } from "@playwright/test";
import { login, openProject, USERS } from "./helpers";

test("governance lead approves gate 5 and advances Sentinel to Phase VI", async ({ page }) => {
  await login(page, USERS.governance_lead);
  await openProject(page, "Sentinel");

  // Guard: this spec expects the seeded pre-walk state
  await expect(page.getByTestId("phase-step-current")).toHaveText("V");

  // Decide the current (Phase V) gate
  const gateForm = page.getByTestId("gate-decide-form");
  await gateForm.getByLabel(/decision/i).selectOption("approved");
  await gateForm
    .getByLabel(/rationale/i)
    .fill("Go decision: evaluation targets met; bias findings carry a documented compensating review rule.");
  await gateForm.getByRole("button", { name: /record gate decision/i }).click();
  await expect(page.getByText(/gate decision:\s*approved/i)).toBeVisible();

  // Advance I→VI is strictly linear; current gate approved unlocks the advance
  await page.getByRole("button", { name: /advance phase/i }).click();
  await expect(page.getByTestId("phase-step-current")).toHaveText("VI");

  // The dashboard reflects it
  await page.goto("/");
  const sentinel = page.getByTestId("project-card").filter({ hasText: "Sentinel" });
  await expect(sentinel.getByTestId("phase-step-current")).toHaveText("VI");
});
