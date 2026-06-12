import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "demo-priora-2026";

export const USERS = {
  governance_lead: "avery.cole@priora.demo",
  executive_sponsor: "morgan.reyes@priora.demo",
  program_manager: "priya.natarajan@priora.demo",
  ml_engineer: "felix.okafor@priora.demo",
  risk_officer: "dana.whitfield@priora.demo",
  auditor: "sam.aldous@priora.demo",
} as const;

export async function login(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/"); // authenticated shell
}

export async function openProject(page: Page, name: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("link", { name, exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+/);
}
