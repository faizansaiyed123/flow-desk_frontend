import { test, expect } from "@playwright/test";
import { uniqueEmail, uniqueName } from "./helpers";

test.describe("Authentication", () => {
  test("a new user can register and lands on the dashboard", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Your name").fill("Ada Lovelace");
    await page.getByLabel("Workspace name").fill(uniqueName("Ada Studio"));
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("supersecret123");
    await page.getByRole("button", { name: "Create workspace" }).click();

    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByText("Overview")).toBeVisible();
  });

  test("shows a validation error for a weak password", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Your name").fill("Ada Lovelace");
    await page.getByLabel("Workspace name").fill(uniqueName("Ada Studio"));
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create workspace" }).click();

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test("an existing user can log in and out", async ({ page }) => {
    const email = uniqueEmail();
    await page.goto("/register");
    await page.getByLabel("Your name").fill("Grace Hopper");
    await page.getByLabel("Workspace name").fill(uniqueName("Grace Co"));
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("supersecret123");
    await page.getByRole("button", { name: "Create workspace" }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/);

    // Log out via the user menu.
    await page.getByRole("button").filter({ hasText: "" }).last().click();
    await page.getByRole("menuitem", { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Log back in.
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("supersecret123");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test("shows an error for incorrect credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("wrongpassword123");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText(/incorrect email or password/i)).toBeVisible();
  });

  test("redirects an unauthenticated user away from a protected page", async ({ page }) => {
    await page.goto("/app/clients");
    await expect(page).toHaveURL(/\/login/);
  });

  test("session survives a page reload", async ({ page }) => {
    const email = uniqueEmail();
    await page.goto("/register");
    await page.getByLabel("Your name").fill("Persistent User");
    await page.getByLabel("Workspace name").fill(uniqueName("Persist Co"));
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("supersecret123");
    await page.getByRole("button", { name: "Create workspace" }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/);

    await page.reload();
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByText("Overview")).toBeVisible();
  });
});
