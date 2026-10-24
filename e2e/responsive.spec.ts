import { test, expect, devices } from "@playwright/test";
import { uniqueEmail, uniqueName } from "./helpers";

test.use({ ...devices["iPhone 13"] });

test("dashboard remains usable on a small viewport, with no horizontal overflow", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Your name").fill("Mobile User");
  await page.getByLabel("Workspace name").fill(uniqueName("Mobile Co"));
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
  await expect(page.getByText("Overview")).toBeVisible();

  // No horizontal overflow: the page's scrollWidth shouldn't exceed the
  // viewport width — a common regression when a fixed-width sidebar is
  // used without a responsive collapse.
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasOverflow).toBe(false);

  // The sidebar is an off-canvas drawer on mobile: it is translated off
  // screen by default, so its bounding box sits outside the viewport.
  const navBox = await page.getByRole("link", { name: "Clients" }).boundingBox();
  const viewport = page.viewportSize()!;
  const offScreen = navBox ? navBox.x + navBox.width <= 0 || navBox.x >= viewport.width : true;
  expect(offScreen).toBe(true);

  // Opening the hamburger button should slide the drawer into view.
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Clients" }).click();
  await expect(page).toHaveURL(/\/app\/clients/);
});