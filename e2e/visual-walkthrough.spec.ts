import { mkdir } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { uniqueEmail, uniqueName } from "./helpers";

const visualsDir = "docs/testing/visuals";

async function capture(page: import("@playwright/test").Page, name: string) {
  await mkdir(visualsDir, { recursive: true });
  await page.screenshot({ path: `${visualsDir}/${name}.png`, fullPage: true });
}

test("captures a real browser-to-API-to-PostgreSQL product walkthrough", async ({ page }) => {
  // This suite uses the real Vite frontend, FastAPI backend, and ephemeral
  // PostgreSQL database configured by .github/workflows/full-stack-e2e.yml.
  // It deliberately does not install MSW or register any mocked API handlers.
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  await capture(page, "00-login");
  await page.getByRole("link", { name: /forgot password/i }).click();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  await capture(page, "00-forgot-password");
  await page.goto("/reset-password");
  await expect(page.getByText(/missing its reset token/i)).toBeVisible();
  await capture(page, "00-invalid-reset-link");
  await page.goto("/accept-invite");
  await expect(page.getByRole("heading", { name: "Invalid invitation" })).toBeVisible();
  await capture(page, "00-invalid-invitation");

  await page.goto("/register");
  await expect(page.getByRole("button", { name: "Create workspace" })).toBeVisible();
  await capture(page, "00-register");

  const workspaceName = uniqueName("Walkthrough Workspace");
  await page.getByLabel("Your name").fill("FlowDesk Walkthrough User");
  await page.getByLabel("Workspace name").fill(workspaceName);
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill("walkthrough-pass-123");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
  await expect(page.getByText("Overview")).toBeVisible();
  await capture(page, "01-dashboard");

  // Client record: create, read, update, then re-read the detail view.
  await page.getByRole("link", { name: "Clients" }).click();
  await expect(page.getByText("No clients yet")).toBeVisible();
  const clientName = "Walkthrough Client";
  await page.getByRole("button", { name: "New client" }).click();
  await page.getByLabel("Name").fill(clientName);
  await page.getByLabel("Company").fill("Walkthrough Studio");
  await page.getByLabel("Email").fill("billing@walkthrough.example");
  await page.getByRole("button", { name: "Create client" }).click();
  await expect(page.getByText(clientName)).toBeVisible();
  await capture(page, "02-clients-list");

  await page.getByText(clientName).click();
  await expect(page.getByRole("heading", { name: clientName })).toBeVisible();
  await capture(page, "03-client-detail");
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Notes").fill("Confirmed in the real full-stack walkthrough.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Confirmed in the real full-stack walkthrough.")).toBeVisible();

  // Project and task records, with a persisted status transition.
  await page.getByRole("link", { name: "Projects" }).click();
  const projectName = "Walkthrough Project";
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Name").fill(projectName);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText(projectName)).toBeVisible();
  await capture(page, "04-projects-list");

  await page.getByText(projectName).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByText("Backlog", { exact: true })).toBeVisible();
  const backlogColumn = page.locator("text=Backlog").locator("..").locator("..");
  await backlogColumn.getByRole("button", { name: /add task/i }).click();
  const taskTitle = "Prepare first milestone";
  await page.getByPlaceholder("Task title...").fill(taskTitle);
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText(taskTitle).first()).toBeVisible();
  await capture(page, "05-project-kanban");

  await page.getByText(taskTitle).first().click();
  const taskTitleInput = page.getByRole("textbox", { name: taskTitle });
  await expect(taskTitleInput).toBeVisible();
  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "In Progress" }).click();
  await expect(page.getByRole("combobox", { name: "Status" })).toContainText("In Progress");
  await capture(page, "06-task-detail-in-progress");
  await page.keyboard.press("Escape");

  // A real server-side timer starts and stops against the created project.
  await page.getByRole("link", { name: "Time" }).click();
  await page.getByText("Select a project to start timing").click();
  await page.getByRole("option", { name: projectName }).click();
  await page.getByRole("button", { name: /start timer/i }).click();
  await expect(page.getByRole("button", { name: /stop/i })).toBeVisible();
  await capture(page, "07-time-tracking-running");
  await page.getByRole("button", { name: /stop/i }).click();
  await expect(page.getByText("No time logged yet")).not.toBeVisible();
  await capture(page, "08-time-tracking-stopped");

  // Invoice data is created through the UI and moves through draft → sent → paid.
  await page.getByRole("link", { name: "Invoices" }).click();
  await page.getByRole("button", { name: /new invoice/i }).click();
  await page.getByLabel("Client").click();
  await page.getByRole("option", { name: clientName }).click();
  await page.getByLabel(/description/i).first().fill("Walkthrough implementation");
  await page.getByLabel(/quantity/i).first().fill("2");
  await page.getByLabel(/unit price/i).first().fill("50");
  await page.getByRole("button", { name: /create invoice/i }).click();
  await expect(page.locator('[aria-label="Invoice status: draft"]')).toBeVisible();
  await capture(page, "09-invoice-draft");

  await page.getByRole("button", { name: /^send$/i }).click();
  await expect(page.locator('[aria-label="Invoice status: sent"]')).toBeVisible();
  await capture(page, "10-invoice-sent");
  await page.getByRole("button", { name: /mark paid/i }).click();
  await expect(page.locator('[aria-label="Invoice status: paid"]')).toBeVisible();
  await capture(page, "11-invoice-paid");

  // Workspace/team settings, one-time API key creation, and webhook management.
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await capture(page, "12-settings-profile");
  await page.getByRole("tab", { name: "Workspace" }).click();
  await capture(page, "13-settings-workspace");

  await page.getByRole("tab", { name: "Team" }).click();
  const inviteEmail = uniqueEmail();
  await page.getByRole("button", { name: /invite/i }).click();
  await page.getByLabel("Email").fill(inviteEmail);
  await page.getByRole("button", { name: /send invitation/i }).click();
  await expect(page.getByText(inviteEmail)).toBeVisible();
  await capture(page, "14-settings-team-invitation");

  await page.getByRole("tab", { name: /api keys/i }).click();
  await page.getByRole("button", { name: /new key/i }).click();
  await page.getByLabel(/key name/i).fill("Walkthrough automation key");
  await page.getByRole("button", { name: /generate key/i }).click();
  await expect(page.getByRole("heading", { name: /copy your api key/i })).toBeVisible();
  // Never capture the one-time plaintext API key in committed screenshots.
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Walkthrough automation key")).toBeVisible();
  await capture(page, "15-settings-api-keys");

  await page.getByRole("tab", { name: "Webhooks" }).click();
  await page.getByRole("button", { name: /new webhook/i }).click();
  const webhookUrl = "https://hooks.example.com/flowdesk-walkthrough";
  await page.getByLabel("Target URL").fill(webhookUrl);
  await page.getByRole("button", { name: "task.created", exact: true }).click();
  await page.getByRole("button", { name: /create webhook/i }).click();
  await expect(page.getByText(webhookUrl)).toBeVisible();
  await capture(page, "16-settings-webhooks");

  // Search results and notification UI are also backed by API requests.
  await page.getByRole("button", { name: /search/i }).click();
  const searchInput = page.getByPlaceholder(/search clients, projects/i);
  await searchInput.fill(projectName);
  await expect(page.getByText(projectName).first()).toBeVisible();
  await capture(page, "17-global-search");

  await page.keyboard.press("Escape");
  const notificationButton = page.locator("button:has(svg.lucide-bell)");
  await notificationButton.click();
  await expect(page.getByText("Notifications")).toBeVisible();
  await capture(page, "18-notifications");
});
