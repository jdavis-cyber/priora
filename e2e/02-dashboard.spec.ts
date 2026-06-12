// E2E FR-01: first load tells the story — 3 demo projects with correct phase
// positions and gate posture.
import { expect, test } from "@playwright/test";
import { login, USERS } from "./helpers";

test("dashboard renders the 3 demo projects with correct phases", async ({ page }) => {
  await login(page, USERS.governance_lead);

  const cards = page.getByTestId("project-card");
  await expect(cards).toHaveCount(3);

  const sentinel = cards.filter({ hasText: "Sentinel" });
  await expect(sentinel.getByTestId("phase-step-current")).toHaveText("V");
  await expect(sentinel.getByTestId("gate-chip")).toHaveText("Pending"); // Go/No-Go awaiting decision

  const cartographer = cards.filter({ hasText: "Cartographer" });
  await expect(cartographer.getByTestId("phase-step-current")).toHaveText("II");

  const ledger = cards.filter({ hasText: "Ledger" });
  await expect(ledger.getByTestId("phase-step-current")).toHaveText("VI");
  await expect(ledger.getByTestId("gate-chip")).toHaveText("Approved");

  // Rollup strip reflects the seed
  await expect(page.getByTestId("rollup-strip")).toContainText("3");
});
