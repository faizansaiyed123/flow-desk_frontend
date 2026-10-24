import { test, expect } from "@playwright/test";
import { uniqueEmail, uniqueName } from "./helpers";

async function registerAndLogin(page: import("@playwright/test").Page, workspaceName: string) {
  await page.goto("/register");
  await page.getByLabel("Your name").fill("Test User");
  await page.getByLabel("Workspace name").fill(workspaceName);
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
}

test.describe("Invoicing", () => {
  test("create a manual invoice and walk it through the status lifecycle", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Invoice Co"));

    // Create a client first (invoices require one).
    await page.getByRole("link", { name: "Clients" }).click();
    const clientName = uniqueName("Billable Client");
    await page.getByRole("button", { name: "New client" }).click();
    await page.getByLabel("Name").fill(clientName);
    await page.getByRole("button", { name: "Create client" }).click();
    await expect(page.getByText(clientName)).toBeVisible();

    await page.getByRole("link", { name: "Invoices" }).click();
    await page.getByRole("button", { name: /new invoice/i }).click();

    await page.getByLabel("Client").click();
    await page.getByRole("option", { name: clientName }).click();
    await page.getByLabel(/description/i).first().fill("Design work");
    await page.getByLabel(/quantity/i).first().fill("10");
    await page.getByLabel(/unit price/i).first().fill("50");
    await page.getByRole("button", { name: /create invoice/i }).click();

    await expect(page.getByText("$500")).toBeVisible();
    await expect(page.locator('[aria-label="Invoice status: draft"]').first()).toBeVisible();

    await page.getByRole("button", { name: /send/i }).click();
    await expect(page.locator('[aria-label="Invoice status: sent"]').first()).toBeVisible();

    await page.getByRole("button", { name: /mark.*paid/i }).click();
    await expect(page.locator('[aria-label="Invoice status: paid"]').first()).toBeVisible();
  });

  test("cannot edit a sent invoice", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Immutable Invoice Co"));
    await page.getByRole("link", { name: "Clients" }).click();
    const clientName = uniqueName("Locked Client");
    await page.getByRole("button", { name: "New client" }).click();
    await page.getByLabel("Name").fill(clientName);
    await page.getByRole("button", { name: "Create client" }).click();

    await page.getByRole("link", { name: "Invoices" }).click();
    await page.getByRole("button", { name: /new invoice/i }).click();
    await page.getByLabel("Client").click();
    await page.getByRole("option", { name: clientName }).click();
    await page.getByLabel(/description/i).first().fill("Work");
    await page.getByLabel(/quantity/i).first().fill("1");
    await page.getByLabel(/unit price/i).first().fill("100");
    await page.getByRole("button", { name: /create invoice/i }).click();

    await page.getByRole("button", { name: /send/i }).click();
    await expect(page.getByText("sent", { exact: true })).toBeVisible();
    // The edit control should no longer be offered once sent.
    await expect(page.getByRole("button", { name: /^edit$/i })).not.toBeVisible();
  });
});
