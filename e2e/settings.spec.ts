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

test.describe("Team and settings", () => {
  test("owner can invite a team member and see the pending invitation", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Team Co"));
    await page.getByRole("link", { name: "Settings" }).click();
    await page.getByRole("tab", { name: "Team" }).click();

    const inviteEmail = uniqueEmail();
    await page.getByRole("button", { name: /invite/i }).click();
    await page.getByLabel("Email").fill(inviteEmail);
    await page.getByRole("button", { name: /send invitation/i }).click();

    await expect(page.getByText(inviteEmail)).toBeVisible();
    await expect(page.getByText("pending", { exact: false })).toBeVisible();
  });

  test("API key can be created and shows its plaintext value once", async ({ page }) => {
    await registerAndLogin(page, uniqueName("API Key Co"));
    await page.getByRole("link", { name: "Settings" }).click();
    await page.getByRole("tab", { name: "API keys" }).click();

    await page.getByRole("button", { name: /new.*key/i }).click();
    await page.getByLabel("Name").fill("CI Integration");
    await page.getByRole("button", { name: /generate.*key/i }).click();

    // The plaintext key is shown once, inside the "Copy your API key" dialog.
    await expect(page.getByRole("heading", { name: /copy your api key/i })).toBeVisible();
    await expect(page.getByRole("dialog").getByText(/fd_live_/)).toBeVisible();
  });
});
