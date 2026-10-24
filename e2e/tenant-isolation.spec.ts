import { test, expect, type Browser } from "@playwright/test";
import { uniqueEmail, uniqueName } from "./helpers";

async function registerInNewContext(browser: Browser, workspaceName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/register");
  await page.getByLabel("Your name").fill("Test User");
  await page.getByLabel("Workspace name").fill(workspaceName);
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
  return { context, page };
}

test.describe("Multi-tenant isolation", () => {
  test("workspace A's clients never appear for workspace B", async ({ browser }) => {
    const { page: pageA, context: contextA } = await registerInNewContext(browser, uniqueName("Tenant A"));
    const { page: pageB, context: contextB } = await registerInNewContext(browser, uniqueName("Tenant B"));

    await pageA.getByRole("link", { name: "Clients" }).click();
    const secretClientName = uniqueName("Tenant A Secret Client");
    await pageA.getByRole("button", { name: "New client" }).click();
    await pageA.getByLabel("Name").fill(secretClientName);
    await pageA.getByRole("button", { name: "Create client" }).click();
    await expect(pageA.getByText(secretClientName)).toBeVisible();

    await pageB.getByRole("link", { name: "Clients" }).click();
    await expect(pageB.getByText(secretClientName)).not.toBeVisible();
    await expect(pageB.getByText("No clients yet")).toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  test("global search only returns results from the current workspace", async ({ browser }) => {
    const uniqueTerm = uniqueName("Unfindable");
    const { page: pageA, context: contextA } = await registerInNewContext(browser, uniqueName("Search Tenant A"));
    const { page: pageB, context: contextB } = await registerInNewContext(browser, uniqueName("Search Tenant B"));

    await pageA.getByRole("link", { name: "Clients" }).click();
    await pageA.getByRole("button", { name: "New client" }).click();
    await pageA.getByLabel("Name").fill(uniqueTerm);
    await pageA.getByRole("button", { name: "Create client" }).click();
    await expect(pageA.getByText(uniqueTerm)).toBeVisible();

    await pageA.keyboard.press("Meta+k");
    await pageA.getByPlaceholder(/search clients, projects/i).fill(uniqueTerm);
    await expect(pageA.getByText(uniqueTerm)).toBeVisible();
    await pageA.keyboard.press("Escape");

    await pageB.keyboard.press("Meta+k");
    await pageB.getByPlaceholder(/search clients, projects/i).fill(uniqueTerm);
    await expect(pageB.getByText(/no results/i)).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
