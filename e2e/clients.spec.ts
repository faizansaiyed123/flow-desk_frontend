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

test.describe("Clients", () => {
  test("create, view, edit, archive, and delete a client", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Client Test Co"));
    await page.getByRole("link", { name: "Clients" }).click();
    await expect(page).toHaveURL(/\/app\/clients/);

    const clientName = uniqueName("Wayne Enterprises");
    await page.getByRole("button", { name: "New client" }).click();
    await page.getByLabel("Name").fill(clientName);
    await page.getByLabel("Company").fill("Wayne Ent.");
    await page.getByLabel("Email").fill("bruce@wayne.com");
    await page.getByRole("button", { name: "Create client" }).click();

    await expect(page.getByText(clientName)).toBeVisible();

    // Open detail page.
    await page.getByText(clientName).click();
    await expect(page.getByRole("heading", { name: clientName })).toBeVisible();
    await expect(page.getByText("Wayne Ent.")).toBeVisible();

    // Edit.
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Notes").fill("VIP client, handle with care.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("VIP client, handle with care.")).toBeVisible();

    // Archive.
    await page.getByRole("button", { name: /archive/i }).click();
    await expect(page.getByRole("button", { name: /unarchive/i })).toBeVisible();

    // Delete.
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete client" }).click();
    await expect(page).toHaveURL(/\/app\/clients$/);
    await expect(page.getByText(clientName)).not.toBeVisible();
  });

  test("shows a validation error when creating a client without a name", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Validation Co"));
    await page.getByRole("link", { name: "Clients" }).click();
    await page.getByRole("button", { name: "New client" }).click();
    await page.getByRole("button", { name: "Create client" }).click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test("search filters the client list", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Search Co"));
    await page.getByRole("link", { name: "Clients" }).click();

    for (const name of ["Alpha Corp", "Beta LLC"]) {
      await page.getByRole("button", { name: "New client" }).click();
      await page.getByLabel("Name").fill(name);
      await page.getByRole("button", { name: "Create client" }).click();
      await expect(page.getByText(name)).toBeVisible();
    }

    await page.getByPlaceholder("Search clients...").fill("Beta");
    await expect(page.getByText("Beta LLC")).toBeVisible();
    await expect(page.getByText("Alpha Corp")).not.toBeVisible();
  });

  test("empty state appears for a brand-new workspace with no clients", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Empty Co"));
    await page.getByRole("link", { name: "Clients" }).click();
    await expect(page.getByText("No clients yet")).toBeVisible();
  });
});
