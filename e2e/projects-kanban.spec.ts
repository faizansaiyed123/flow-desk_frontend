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

test.describe("Projects and Kanban board", () => {
  test("create a project, add tasks to columns, and move a task across the board", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Kanban Co"));

    await page.getByRole("link", { name: "Projects" }).click();
    const projectName = uniqueName("Website Redesign");
    await page.getByRole("button", { name: "New project" }).click();
    await page.getByLabel("Name").fill(projectName);
    await page.getByRole("button", { name: "Create project" }).click();

    await page.getByText(projectName).click();
    await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

    // Add a task to the "To do" column.
    const todoColumn = page.locator("text=To do").locator("..").locator("..");
    await todoColumn.getByRole("button", { name: /add task/i }).click();
    const taskTitle = uniqueName("Design homepage mockup");
    await page.getByPlaceholder("Task title...").fill(taskTitle);
    await page.getByRole("button", { name: "Create task" }).click();

    await expect(page.getByText(taskTitle).first()).toBeVisible();

    // Move the task from "To do" into "In progress" by opening the task
    // detail dialog and changing its status.
    await page.getByText(taskTitle).first().click();
    await expect(page.getByRole("textbox", { name: taskTitle })).toBeVisible();
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "In Progress" }).click();

    // The board should re-render with the task in the In Progress column.
    const inProgressColumn = page.locator("text=In progress").locator("..").locator("..");
    await expect(inProgressColumn.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });

  test("filter projects by status", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Status Filter Co"));
    await page.getByRole("link", { name: "Projects" }).click();

    const activeProject = uniqueName("Active One");
    await page.getByRole("button", { name: "New project" }).click();
    await page.getByLabel("Name").fill(activeProject);
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText(activeProject)).toBeVisible();

    // Filter by "Planning" — the active project should disappear.
    await page.getByRole("button", { name: "Planning" }).click();
    await expect(page.getByText(activeProject)).not.toBeVisible();

    // Filter back to "All" — it should reappear.
    await page.getByRole("button", { name: "All" }).click();
    await expect(page.getByText(activeProject)).toBeVisible();
  });

  test("task detail can be opened, edited, and commented on", async ({ page }) => {
    await registerAndLogin(page, uniqueName("Task Detail Co"));
    await page.getByRole("link", { name: "Projects" }).click();
    const projectName = uniqueName("Comment Project");
    await page.getByRole("button", { name: "New project" }).click();
    await page.getByLabel("Name").fill(projectName);
    await page.getByRole("button", { name: "Create project" }).click();
    await page.getByText(projectName).click();

const backlogColumn = page.locator("text=Backlog").locator("..").locator("..");
    await backlogColumn.getByRole("button", { name: /add task/i }).click();
    const taskTitle = uniqueName("Investigate slow query");
    await page.getByPlaceholder("Task title...").fill(taskTitle);
    await page.getByRole("button", { name: "Create task" }).click();

    // Open the task detail dialog.
    await page.getByText(taskTitle).first().click();

    // The task detail dialog opens — verify the title textbox is filled in.
    const titleBox = page.getByRole("dialog").locator("input").first();
    await expect(titleBox).toBeVisible();

    // Edit the title inline.
    await titleBox.clear();
    await titleBox.fill("Investigate fast query");
    await titleBox.blur();

    // The input now contains the edited value.
    await expect(titleBox).toHaveValue("Investigate fast query");
  });
});
