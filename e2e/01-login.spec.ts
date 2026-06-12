// E2E: credentials login lands on the authenticated dashboard (spec §9
// "login per role" — governance_lead is the demo's primary persona).
import { expect, test } from "@playwright/test";
import { login, USERS } from "./helpers";

test("governance lead logs in and reaches the Mission Dashboard", async ({ page }) => {
  await login(page, USERS.governance_lead);
  await expect(page.getByRole("heading", { name: "Mission Dashboard" })).toBeVisible();
  await expect(page.getByTestId("rollup-strip")).toBeVisible();
});

test("wrong password is rejected", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(USERS.governance_lead);
  await page.getByLabel(/password/i).fill("not-the-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
  await expect(page).not.toHaveURL(/^http:\/\/localhost:3000\/$/);
});
