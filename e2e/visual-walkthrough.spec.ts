import { mkdir, readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import { uniqueEmail } from "./helpers";

const visualsDir = "docs/testing/visuals";

async function capture(page: Page, name: string) {
  await mkdir(visualsDir, { recursive: true });
  await page.screenshot({ path: `${visualsDir}/${name}.png`, fullPage: true });
}

async function waitForApiResponse(
  page: Page,
  method: string,
  path: string,
  action: () => Promise<unknown>,
) {
  const responsePromise = page.waitForResponse((response) => {
    const request = response.request();
    const url = new URL(response.url());
    return request.method() === method && url.pathname === `/api/v1${path}`;
  }, { timeout: 15_000 });
  await action();
  return responsePromise;
}

async function expectSuccessfulApiAction(
  page: Page,
  method: string,
  path: string,
  action: () => Promise<unknown>,
) {
  const response = await waitForApiResponse(page, method, path, action);
  expect(
    response.status(),
    `${method} /api/v1${path} should succeed; response was ${response.status()}`,
  ).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  return response;
}

test("captures real FlowDesk browser actions, API responses, and persistent PostgreSQL records", async ({ page, browser }) => {
  test.setTimeout(600_000);
  // This test is deliberately not wired to MSW and has no route mocks:
  // Vite forwards /api to the actual FastAPI process and PostgreSQL database.
  const observedApiResponses: Array<{ method: string; path: string; status: number }> = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith("/api/v1/")) {
      observedApiResponses.push({
        method: response.request().method(),
        path: url.pathname,
        status: response.status(),
      });
    }
  });

  // Public authentication and recovery paths.
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  await capture(page, "00-login");

  await page.getByRole("link", { name: /forgot password/i }).click();
  await expect(page).toHaveURL(/forgot-password$/);
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  const recoveryEmail = uniqueEmail();
  const recoveryEmailInput = page.getByRole("textbox", { name: "Email" });
  await recoveryEmailInput.fill(recoveryEmail);
  await expect(recoveryEmailInput).toHaveValue(recoveryEmail);
  await expect(page.getByText("Enter a valid email address.")).toHaveCount(0);
  const recovery = await expectSuccessfulApiAction(
    page,
    "POST",
    "/auth/forgot-password",
    () => page.getByRole("button", { name: "Send reset link" }).click(),
  );
  expect(await recovery.json()).toHaveProperty("message");
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await capture(page, "00-forgot-password");

  await page.goto("/reset-password");
  await expect(page.getByText(/missing its reset token/i)).toBeVisible();
  await capture(page, "00-missing-reset-token");

  await page.goto("/reset-password?token=invalid-walkthrough-token");
  await page.getByLabel("New password").fill("another-valid-pass-123");
  const invalidReset = await waitForApiResponse(
    page,
    "POST",
    "/auth/reset-password",
    () => page.getByRole("button", { name: "Reset password" }).click(),
  );
  expect(invalidReset.status()).toBeGreaterThanOrEqual(400);
  expect(invalidReset.status()).toBeLessThan(500);
  await expect(page.getByText(/invalid|expired|reset token/i)).toBeVisible();
  await capture(page, "00-invalid-reset-link");

  await page.goto("/accept-invite");
  await expect(page.getByRole("heading", { name: "Invalid invitation" })).toBeVisible();
  await capture(page, "00-missing-invitation-token");
  const invalidInvite = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return response.request().method() === "GET" &&
      url.pathname === "/api/v1/tenants/invitations/invalid-walkthrough-invitation";
  });
  await page.goto("/accept-invite?token=invalid-walkthrough-invitation");
  await expect(page.getByRole("heading", { name: /invitation not found/i })).toBeVisible();
  const invalidInviteResponse = await invalidInvite;
  expect(invalidInviteResponse.status()).toBeGreaterThanOrEqual(400);
  await capture(page, "00-invalid-invitation");

  // Register a real account and workspace through the UI.
  await page.goto("/register");
  await expect(page.getByRole("button", { name: "Create workspace" })).toBeVisible();
  await capture(page, "00-register");

  const accountEmail = uniqueEmail();
  await page.getByLabel("Your name").fill("FlowDesk Walkthrough User");
  await page.getByLabel("Workspace name").fill("FlowDesk Visual Walkthrough");
  await page.getByLabel("Email").fill(accountEmail);
  await page.getByLabel("Password").fill("walkthrough-pass-123");
  const registration = await expectSuccessfulApiAction(
    page,
    "POST",
    "/auth/register",
    () => page.getByRole("button", { name: "Create workspace" }).click(),
  );
  const registeredAccount = await registration.json();
  expect(registeredAccount).toHaveProperty("access_token");
  await expect(page).toHaveURL(/\/app\/dashboard/);
  await expect(page.getByText("Overview")).toBeVisible();
  await capture(page, "01-dashboard");

  // Client: create, read, update and reload to read the saved note from the API.
  await page.getByRole("link", { name: "Clients" }).click();
  await expect(page.getByText("No clients yet")).toBeVisible();
  const clientName = "Walkthrough Client";
  const clientCreated = await expectSuccessfulApiAction(
    page,
    "POST",
    "/clients",
    async () => {
      await page.getByRole("button", { name: "New client" }).click();
      await page.getByLabel("Name").fill(clientName);
      await page.getByLabel("Company").fill("Walkthrough Studio");
      await page.getByLabel("Email").fill(uniqueEmail());
      await page.getByRole("button", { name: "Create client" }).click();
    },
  );
  const client = await clientCreated.json();
  expect(client.name).toBe(clientName);
  await expect(page.getByText(clientName)).toBeVisible();
  await capture(page, "02-clients-list");

  await page.getByText(clientName).click();
  await expect(page.getByRole("heading", { name: clientName })).toBeVisible();
  await capture(page, "03-client-detail");
  const note = "Confirmed in the real full-stack walkthrough.";
  await expectSuccessfulApiAction(
    page,
    "PATCH",
    `/clients/${client.id}`,
    async () => {
      await page.getByRole("button", { name: "Edit" }).click();
      await page.getByLabel("Notes").fill(note);
      await page.getByRole("button", { name: "Save changes" }).click();
    },
  );
  await expect(page.getByText(note)).toBeVisible();
  const savedClient = page.waitForResponse((response) =>
    response.request().method() === "GET" &&
    new URL(response.url()).pathname === `/api/v1/clients/${client.id}`,
  );
  await page.reload();
  const savedClientResponse = await savedClient;
  expect(savedClientResponse.ok()).toBeTruthy();
  await expect(page.getByText(note)).toBeVisible();
  await capture(page, "03-client-detail-updated");

  // Project and Kanban task: verify server response and reload the saved status.
  await page.getByRole("link", { name: "Projects" }).click();
  const projectName = "Walkthrough Project";
  const projectCreated = await expectSuccessfulApiAction(
    page,
    "POST",
    "/projects",
    async () => {
      await page.getByRole("button", { name: "New project" }).click();
      await page.getByLabel("Name").fill(projectName);
      await page.getByLabel("Description").fill("Initial project description");
      await page.getByLabel("Client").click();
      await page.getByRole("option", { name: clientName }).click();
      await page.getByRole("combobox", { name: "Billing type" }).click();
      await page.getByRole("option", { name: "Hourly", exact: true }).click();
      await page.getByLabel("Hourly rate").fill("120");
      await page.getByRole("button", { name: "Create project" }).click();
    },
  );
  const project = await projectCreated.json();
  expect(project.name).toBe(projectName);
  expect(project.client_id).toBe(client.id);
  expect(project.billing_type).toBe("hourly");
  expect(Number(project.hourly_rate)).toBe(120);
  await expect(page.getByText(projectName)).toBeVisible();
  await capture(page, "04-projects-list");

  await page.getByRole("link", { name: projectName, exact: true }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  const updatedProjectResponse = await expectSuccessfulApiAction(
    page,
    "PATCH",
    "/projects/" + project.id,
    async () => {
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      const editProjectDialog = page.getByRole("dialog");
      await editProjectDialog.getByLabel("Description").fill("Updated from the project detail page.");
      await editProjectDialog.getByRole("button", { name: "Save changes" }).click();
    },
  );
  expect((await updatedProjectResponse.json()).description).toBe("Updated from the project detail page.");
  await expect(page.getByText("Backlog", { exact: true })).toBeVisible();
  await capture(page, "04b-project-details-updated");

  const taskTitle = "Prepare first milestone";
  const taskCreated = await expectSuccessfulApiAction(
    page,
    "POST",
    "/tasks",
    async () => {
      const backlogColumn = page.locator("text=Backlog").locator("..").locator("..");
      await backlogColumn.getByRole("button", { name: /add task/i }).click();
      await page.getByPlaceholder("Task title...").fill(taskTitle);
      await page.getByRole("button", { name: "Create task" }).click();
    },
  );
  const task = await taskCreated.json();
  expect(task.title).toBe(taskTitle);
  await expect(page.getByText(taskTitle).first()).toBeVisible();
  await capture(page, "05-project-kanban");

  await page.getByText(taskTitle).first().click();
  await expect(page.getByRole("textbox", { name: taskTitle })).toBeVisible();
  const movedTask = await expectSuccessfulApiAction(
    page,
    "PATCH",
    `/tasks/${task.id}`,
    async () => {
      await page.getByRole("combobox", { name: "Status" }).click();
      await page.getByRole("option", { name: "In Progress" }).click();
    },
  );
  expect((await movedTask.json()).status).toBe("in_progress");
  await expect(page.getByRole("combobox", { name: "Status" })).toContainText("In Progress");
  await capture(page, "06-task-detail-in-progress");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByText(taskTitle).first()).toBeVisible();
  await capture(page, "06-task-status-reloaded");

  // Project attachments: upload a real multipart file, download its bytes, and delete a second file.
  await page.getByRole("tab", { name: "Files" }).click();
  await expect(page.getByText("No files attached yet.")).toBeVisible();
  const attachmentContent = "FlowDesk real full-stack walkthrough attachment. PostgreSQL and disk storage are verified.";
  const attachmentResponse = await expectSuccessfulApiAction(
    page,
    "POST",
    "/attachments",
    () => page.getByLabel("Upload project attachment").setInputFiles({
      name: "walkthrough-evidence.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(attachmentContent, "utf8"),
    }),
  );
  const attachment = await attachmentResponse.json();
  expect(attachment.file_name).toBe("walkthrough-evidence.txt");
  expect(attachment.project_id).toBe(project.id);
  await expect(page.getByText("walkthrough-evidence.txt")).toBeVisible();

  // Content-Disposition makes Chromium treat the response as a download, so
  // verify the saved browser download rather than reading response.body() (which
  // is not exposed for attachment downloads in Playwright's captured response).
  const browserDownloadPromise = page.waitForEvent("download");
  const attachmentDownload = await expectSuccessfulApiAction(
    page,
    "GET",
    "/attachments/" + attachment.id + "/download",
    () => page.getByRole("button", { name: "Download walkthrough-evidence.txt" }).click(),
  );
  expect(attachmentDownload.status()).toBe(200);
  const browserDownload = await browserDownloadPromise;
  expect(browserDownload.suggestedFilename()).toBe("walkthrough-evidence.txt");
  const downloadedPath = await browserDownload.path();
  if (!downloadedPath) throw new Error("The attachment download did not produce a local file.");
  expect((await readFile(downloadedPath)).toString("utf8")).toBe(attachmentContent);

  const temporaryAttachmentResponse = await expectSuccessfulApiAction(
    page,
    "POST",
    "/attachments",
    () => page.getByLabel("Upload project attachment").setInputFiles({
      name: "temporary-delete.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Delete this real upload after verifying the delete endpoint.", "utf8"),
    }),
  );
  const temporaryAttachment = await temporaryAttachmentResponse.json();
  expect(temporaryAttachment.project_id).toBe(project.id);
  const temporaryAttachmentRow = page.locator('[data-attachment-id="' + temporaryAttachment.id + '"]');
  await expect(temporaryAttachmentRow.getByText("temporary-delete.txt", { exact: true })).toBeVisible();
  await expectSuccessfulApiAction(
    page,
    "DELETE",
    "/attachments/" + temporaryAttachment.id,
    () => temporaryAttachmentRow.getByRole("button", { name: "Delete temporary-delete.txt" }).click(),
  );
  await expect(temporaryAttachmentRow).not.toBeVisible();
  await capture(page, "07-project-attachments");

  // Manual time entry plus the server-side timer lifecycle.
  await page.getByRole("link", { name: "Time" }).click();
  await page.getByRole("button", { name: /log time manually/i }).click();
  await page.getByRole("dialog").getByText(/select a project/i).click();
  await page.getByRole("option", { name: projectName }).click();
  await page.getByLabel("Date & time").fill("2026-10-24T10:00");
  await page.getByLabel("Minutes").fill("45");
  await page.getByLabel("Description").fill("Manual verification entry");
  const manualTime = await expectSuccessfulApiAction(
    page,
    "POST",
    "/time-entries",
    () => page.getByRole("dialog").getByRole("button", { name: "Log time", exact: true }).click(),
  );
  const manualEntry = await manualTime.json();
  expect(manualEntry.duration_minutes).toBe(45);
  await expect(page.getByText("Manual verification entry", { exact: true })).toBeVisible();
  const updatedManualTime = await expectSuccessfulApiAction(
    page,
    "PATCH",
    "/time-entries/" + manualEntry.id,
    async () => {
      await page.getByRole("button", { name: "Edit time entry Manual verification entry" }).click();
      const editDialog = page.getByRole("dialog");
      await editDialog.getByLabel("Description").fill("Manual verification entry edited");
      await editDialog.getByRole("button", { name: "Save time entry" }).click();
    },
  );
  expect((await updatedManualTime.json()).description).toBe("Manual verification entry edited");
  await expect(page.getByText("Manual verification entry edited")).toBeVisible();
  await capture(page, "08-time-tracking-manual-entry");

  const temporaryTimeResponse = await expectSuccessfulApiAction(
    page,
    "POST",
    "/time-entries",
    async () => {
      await page.getByRole("button", { name: /log time manually/i }).click();
      const temporaryTimeDialog = page.getByRole("dialog");
      await temporaryTimeDialog.getByText(/select a project/i).click();
      await page.getByRole("option", { name: projectName }).click();
      await temporaryTimeDialog.getByLabel("Date & time").fill("2026-10-24T09:00");
      await temporaryTimeDialog.getByLabel("Minutes").fill("15");
      await temporaryTimeDialog.getByLabel("Description").fill("Temporary time entry to delete");
      await temporaryTimeDialog.getByRole("button", { name: "Log time", exact: true }).click();
    },
  );
  const temporaryTimeEntry = await temporaryTimeResponse.json();
  expect(temporaryTimeEntry.duration_minutes).toBe(15);
  const temporaryTimeRow = page.locator('[data-time-entry-id="' + temporaryTimeEntry.id + '"]');
  await expect(temporaryTimeRow.getByText("Temporary time entry to delete", { exact: true })).toBeVisible();
  await expectSuccessfulApiAction(
    page,
    "DELETE",
    "/time-entries/" + temporaryTimeEntry.id,
    () => temporaryTimeRow.getByRole("button", { name: "Delete time entry Temporary time entry to delete" }).click(),
  );
  await expect(temporaryTimeRow).not.toBeVisible();
  await capture(page, "08b-time-entry-deleted");

  await page.getByText("Select a project to start timing").click();
  await page.getByRole("option", { name: projectName }).click();
  await expectSuccessfulApiAction(
    page,
    "POST",
    "/time-entries/timer/start",
    () => page.getByRole("button", { name: /start timer/i }).click(),
  );
  await expect(page.getByRole("button", { name: /stop/i })).toBeVisible();
  await capture(page, "09-time-tracking-running");
  const stoppedTimer = await expectSuccessfulApiAction(
    page,
    "POST",
    "/time-entries/timer/stop",
    () => page.getByRole("button", { name: /stop/i }).click(),
  );
  expect((await stoppedTimer.json()).ended_at).toBeTruthy();
  await expect(page.getByText("Manual verification entry edited", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Manual verification entry edited", { exact: true })).toBeVisible();
  await capture(page, "10-time-tracking-stopped-reloaded");

  // Generate an invoice from completed billable time using the project billing configuration.
  await page.locator("nav").getByRole("link", { name: "Projects" }).click();
  await page.getByText(projectName).click();
  await expect(page.getByRole("button", { name: /invoice unbilled time/i })).toBeEnabled();
  const generatedTimeRead = page.waitForResponse((response) =>
    response.request().method() === "GET" &&
    new URL(response.url()).pathname === "/api/v1/time-entries" &&
    new URL(response.url()).searchParams.get("project_id") === project.id,
  );
  const generatedFromTimeResponse = await expectSuccessfulApiAction(
    page,
    "POST",
    "/invoices/generate-from-time",
    () => page.getByRole("button", { name: /invoice unbilled time/i }).click(),
  );
  const generatedTimeInvoice = await generatedFromTimeResponse.json();
  expect(generatedTimeInvoice.status).toBe("draft");
  expect(generatedTimeInvoice.project_id).toBe(project.id);
  expect(generatedTimeInvoice.line_items.length).toBeGreaterThan(0);
  expect(Number(generatedTimeInvoice.line_items[0].quantity)).toBeGreaterThan(0);
  expect(Number(generatedTimeInvoice.total)).toBeGreaterThan(0);
  const invoicedTimeReadResponse = await generatedTimeRead;
  expect(invoicedTimeReadResponse.ok()).toBeTruthy();
  const timeEntriesAfterInvoicing = await invoicedTimeReadResponse.json();
  expect(timeEntriesAfterInvoicing.items.filter((entry: { is_invoiced: boolean }) => entry.is_invoiced).length).toBeGreaterThan(0);
  await page.locator("nav").getByRole("link", { name: "Invoices" }).click();
  await page.getByText(generatedTimeInvoice.invoice_number, { exact: true }).click();
  await expect(page.getByRole("heading", { name: generatedTimeInvoice.invoice_number })).toBeVisible();
  await capture(page, "10b-invoice-from-time-generated");

  // A second browser/API-generated invoice will remain draft; the following manual invoice
  // covers the sent/paid lifecycle separately.
  // Invoice lifecycle: draft → sent → paid, followed by a fresh server read.
  await page.locator("nav").getByRole("link", { name: "Invoices" }).click();
  await page.getByRole("button", { name: /new invoice/i }).click();
  await page.getByLabel("Client").click();
  await page.getByRole("option", { name: clientName }).click();
  await page.getByLabel(/description/i).first().fill("Walkthrough implementation");
  await page.getByLabel(/quantity/i).first().fill("2");
  await page.getByLabel(/unit price/i).first().fill("50");
  const invoiceCreated = await expectSuccessfulApiAction(
    page,
    "POST",
    "/invoices",
    () => page.getByRole("button", { name: /create invoice/i }).click(),
  );
  const invoice = await invoiceCreated.json();
  expect(invoice.status).toBe("draft");
  expect(Number(invoice.total)).toBe(100);
  await expect(page.locator('[aria-label="Invoice status: draft"]')).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit draft invoice" })).toBeVisible();
  await page.getByLabel("Invoice notes").fill("Edited in the full-stack walkthrough.");
  await capture(page, "11-invoice-draft-edit");
  const invoiceUpdated = await expectSuccessfulApiAction(
    page,
    "PATCH",
    "/invoices/" + invoice.id,
    () => page.getByRole("button", { name: "Save draft changes" }).click(),
  );
  expect((await invoiceUpdated.json()).notes).toBe("Edited in the full-stack walkthrough.");
  await expect(page.locator('[aria-label="Invoice status: draft"]')).toBeVisible();
  await capture(page, "12-invoice-draft");

  const invoiceSent = await expectSuccessfulApiAction(
    page,
    "POST",
    `/invoices/${invoice.id}/send`,
    () => page.getByRole("button", { name: /^send$/i }).click(),
  );
  expect((await invoiceSent.json()).status).toBe("sent");
  await expect(page.locator('[aria-label="Invoice status: sent"]')).toBeVisible();
  await capture(page, "13-invoice-sent");

  const invoicePaid = await expectSuccessfulApiAction(
    page,
    "POST",
    `/invoices/${invoice.id}/mark-paid`,
    () => page.getByRole("button", { name: /mark paid/i }).click(),
  );
  expect((await invoicePaid.json()).status).toBe("paid");
  await expect(page.locator('[aria-label="Invoice status: paid"]')).toBeVisible();
  const freshInvoiceRead = page.waitForResponse((response) =>
    response.request().method() === "GET" &&
    new URL(response.url()).pathname === `/api/v1/invoices/${invoice.id}`,
  );
  await page.reload();
  const freshInvoice = await freshInvoiceRead;
  expect(freshInvoice.ok()).toBeTruthy();
  expect((await freshInvoice.json()).status).toBe("paid");
  await expect(page.locator('[aria-label="Invoice status: paid"]')).toBeVisible();
  await capture(page, "14-invoice-paid-reloaded");

  // A past-due sent invoice can be explicitly transitioned to overdue.
  await page.locator("nav").getByRole("link", { name: "Invoices" }).click();
  await page.getByRole("button", { name: /new invoice/i }).click();
  await page.getByLabel("Client").click();
  await page.getByRole("option", { name: clientName }).click();
  await page.getByLabel(/description/i).first().fill("Overdue walkthrough work");
  await page.getByLabel(/quantity/i).first().fill("1");
  await page.getByLabel(/unit price/i).first().fill("25");
  const overdueDate = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Due date").fill(overdueDate);
  const overdueDraftResponse = await expectSuccessfulApiAction(
    page,
    "POST",
    "/invoices",
    () => page.getByRole("button", { name: /create invoice/i }).click(),
  );
  const overdueDraft = await overdueDraftResponse.json();
  expect(overdueDraft.status).toBe("draft");
  expect(overdueDraft.due_date).toBe(overdueDate);
  await expectSuccessfulApiAction(
    page,
    "POST",
    "/invoices/" + overdueDraft.id + "/send",
    () => page.getByRole("button", { name: /^send$/i }).click(),
  );
  await expect(page.getByRole("button", { name: "Mark overdue" })).toBeVisible();
  const markedOverdue = await expectSuccessfulApiAction(
    page,
    "POST",
    "/invoices/" + overdueDraft.id + "/mark-overdue",
    () => page.getByRole("button", { name: "Mark overdue" }).click(),
  );
  expect((await markedOverdue.json()).status).toBe("overdue");
  await expect(page.locator('[aria-label="Invoice status: overdue"]')).toBeVisible();
  await capture(page, "14-overdue-invoice");

  const voidedInvoice = await expectSuccessfulApiAction(
    page,
    "POST",
    "/invoices/" + overdueDraft.id + "/void",
    () => page.getByRole("button", { name: "Void", exact: true }).click(),
  );
  expect((await voidedInvoice.json()).status).toBe("void");
  await expect(page.locator('[aria-label="Invoice status: void"]')).toBeVisible();
  await capture(page, "14b-invoice-void");

  // Settings: invitation, one-time API key, webhook. Never screenshot secrets.
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  const profileUpdate = await expectSuccessfulApiAction(
    page,
    "PATCH",
    "/users/me",
    async () => {
      await page.getByLabel("Full name").fill("FlowDesk Walkthrough User Updated");
      await page.getByRole("button", { name: "Save profile" }).click();
    },
  );
  expect((await profileUpdate.json()).full_name).toBe("FlowDesk Walkthrough User Updated");
  await expect(page.getByLabel("Full name")).toHaveValue("FlowDesk Walkthrough User Updated");
  await capture(page, "15-settings-profile");
  await page.getByRole("tab", { name: "Workspace" }).click();
  const workspaceUpdate = await expectSuccessfulApiAction(
    page,
    "PATCH",
    "/tenants/current",
    async () => {
      await page.getByLabel("Workspace name").fill("FlowDesk Visual Walkthrough Updated");
      await page.getByRole("button", { name: "Save", exact: true }).click();
    },
  );
  expect((await workspaceUpdate.json()).name).toBe("FlowDesk Visual Walkthrough Updated");
  await expect(page.getByLabel("Workspace name")).toHaveValue("FlowDesk Visual Walkthrough Updated");
  await capture(page, "16-settings-workspace");

  await page.getByRole("tab", { name: "Team" }).click();
  const inviteEmail = "walkthrough-invitation@example.com";
  const invitation = await expectSuccessfulApiAction(
    page,
    "POST",
    "/tenants/invitations",
    async () => {
      await page.getByRole("button", { name: /invite/i }).click();
      await page.getByLabel("Email").fill(inviteEmail);
      await page.getByRole("button", { name: /send invitation/i }).click();
    },
  );
  expect((await invitation.json()).email).toBe(inviteEmail);
  await expect(page.getByText(inviteEmail)).toBeVisible();
  await capture(page, "17-settings-team-invitation");

  // Create a second real invitation and use the token that the backend generated
  // and logged in the disposable CI environment; no token or API response is mocked.
  const acceptedInviteEmail = uniqueEmail();
  const acceptedInvite = await expectSuccessfulApiAction(
    page,
    "POST",
    "/tenants/invitations",
    async () => {
      await page.getByRole("button", { name: /invite/i }).click();
      await page.getByLabel("Email").fill(acceptedInviteEmail);
      await page.getByRole("button", { name: /send invitation/i }).click();
    },
  );
  expect((await acceptedInvite.json()).email).toBe(acceptedInviteEmail);
  const backendLogPath = process.env.BACKEND_LOG_PATH;
  expect(backendLogPath).toBeTruthy();
  const readInvitationToken = async () => {
    const logText = await readFile(backendLogPath!, "utf8");
    const emailOffset = logText.lastIndexOf("to=" + acceptedInviteEmail);
    if (emailOffset < 0) return "";
    const emailLog = logText.slice(emailOffset);
    return emailLog.match(/Accept the invitation: http:\/\/localhost:5173\/accept-invite\?token=([A-Za-z0-9_-]+)/)?.[1] ?? "";
  };
  await expect.poll(readInvitationToken, { timeout: 15_000 }).not.toBe("");
  const acceptedInviteToken = await readInvitationToken();

  const inviteeContext = await browser.newContext();
  const inviteePage = await inviteeContext.newPage();
  await inviteePage.goto("http://localhost:5173/accept-invite?token=" + encodeURIComponent(acceptedInviteToken));
  await expect(inviteePage.getByRole("heading", { name: /Join FlowDesk Visual Walkthrough/i })).toBeVisible();
  await inviteePage.getByLabel("Your name").fill("FlowDesk Invited Member");
  await inviteePage.getByLabel("Choose a password").fill("invitee-pass-123");
  const accepted = await expectSuccessfulApiAction(
    inviteePage,
    "POST",
    "/tenants/invitations/accept",
    () => inviteePage.getByRole("button", { name: /create account & join/i }).click(),
  );
  expect(await accepted.json()).toHaveProperty("access_token");
  await expect(inviteePage).toHaveURL(/dashboard$/);
  await expect(inviteePage.getByText("Overview")).toBeVisible();
  await capture(inviteePage, "17b-invitation-accepted");

  // Reload the owner workspace so the member list is fetched afresh from the API.
  await page.reload();
  const membersResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "GET" &&
    new URL(response.url()).pathname === "/api/v1/tenants/members",
  );
  await page.getByRole("tab", { name: "Team" }).click();
  const membersResponse = await membersResponsePromise;
  expect(membersResponse.ok()).toBeTruthy();
  const teamMembers = await membersResponse.json();
  const acceptedMember = teamMembers.find((member: { user: { email: string }; membership_id: string }) =>
    member.user.email === acceptedInviteEmail
  );
  if (!acceptedMember) throw new Error("Accepted invitation did not create a workspace membership.");
  const invitedUserId = acceptedMember.user.id;
  const acceptedMemberRow = page.getByText("FlowDesk Invited Member").locator("..").locator("..");
  const memberRoleUpdate = page.waitForResponse((response) =>
    response.request().method() === "PATCH" &&
    new URL(response.url()).pathname === "/api/v1/tenants/members/" + acceptedMember.membership_id + "/role",
  );
  await acceptedMemberRow.getByRole("combobox").click();
  await page.getByRole("option", { name: "Admin" }).click();
  const roleUpdate = await memberRoleUpdate;
  expect(roleUpdate.ok()).toBeTruthy();
  await expect(acceptedMemberRow.getByRole("combobox")).toContainText("Admin");
  await capture(page, "17c-team-member-role-updated");

  // Revoke a separate invitation and verify the DELETE request is handled by the API.
  const revokeEmail = "walkthrough-revoked@example.com";
  const revocableInvite = await expectSuccessfulApiAction(
    page,
    "POST",
    "/tenants/invitations",
    async () => {
      await page.getByRole("button", { name: /invite/i }).click();
      await page.getByLabel("Email").fill(revokeEmail);
      await page.getByRole("button", { name: /send invitation/i }).click();
    },
  );
  const revocableInvitation = await revocableInvite.json();
  const revocationRow = page.getByText(revokeEmail).locator("..").locator("..");
  const revokeResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "DELETE" &&
    new URL(response.url()).pathname === "/api/v1/tenants/invitations/" + revocableInvitation.id,
  );
  await revocationRow.getByRole("button", { name: "Revoke" }).click();
  const revokeResponse = await revokeResponsePromise;
  expect(revokeResponse.ok()).toBeTruthy();
  await expect(page.getByText(revokeEmail)).not.toBeVisible();
  await capture(page, "17d-team-invitation-revoked");

  // Keep the one-time API-key response outside the primary Playwright-traced context.
  // This is still an authenticated real browser session against the same backend/database.
  const apiKeyContext = await browser.newContext({ storageState: await page.context().storageState() });
  const apiKeyPage = await apiKeyContext.newPage();
  await apiKeyPage.goto("http://localhost:5173/app/settings");
  await expect(apiKeyPage.getByRole("heading", { name: "Settings" })).toBeVisible();
  await apiKeyPage.getByRole("tab", { name: /api keys/i }).click();
  await apiKeyPage.getByRole("button", { name: /new key/i }).click();
  await apiKeyPage.getByLabel("Name").fill("Walkthrough automation key");
  const apiKeyCreation = await expectSuccessfulApiAction(
    apiKeyPage,
    "POST",
    "/api-keys",
    () => apiKeyPage.getByRole("button", { name: /generate key/i }).click(),
  );
  const apiKeyData = await apiKeyCreation.json();
  const apiKeyHasExpectedPrefix = typeof apiKeyData.plaintext_key === "string" && apiKeyData.plaintext_key.startsWith("fd_live_");
  const apiKeyHasId = typeof apiKeyData.id === "string" && apiKeyData.id.length > 0;
  const apiKeyCopyHeading = apiKeyPage.getByRole("heading", { name: /copy your api key/i });
  await expect(apiKeyCopyHeading).toBeVisible();
  const renderedSecret = apiKeyPage.getByRole("dialog").locator("code");
  await expect(renderedSecret).toBeVisible();
  // Mask the one-time key in this untraced test context too, before later actions.
  await renderedSecret.evaluate((node) => { node.textContent = "[REDACTED]"; });
  const apiKeyCopyDialogWasVisible = await apiKeyCopyHeading.isVisible();
  await apiKeyPage.getByRole("button", { name: "Done" }).click();
  expect(apiKeyHasExpectedPrefix).toBe(true);
  expect(apiKeyHasId).toBe(true);
  expect(apiKeyCopyDialogWasVisible).toBe(true);
  await expect(apiKeyPage.getByText("Walkthrough automation key", { exact: true })).toBeVisible();
  await capture(apiKeyPage, "18-settings-api-keys");
  const apiKeyRow = apiKeyPage.getByText("Walkthrough automation key", { exact: true }).locator("..").locator("..");
  const revokedApiKey = await expectSuccessfulApiAction(
    apiKeyPage,
    "DELETE",
    "/api-keys/" + apiKeyData.id,
    () => apiKeyRow.getByRole("button").click(),
  );
  expect((await revokedApiKey.json()).message).toMatch(/revoked/i);
  await expect(apiKeyRow.getByText("Revoked", { exact: true })).toBeVisible();
  await capture(apiKeyPage, "18b-settings-api-key-revoked");
  await apiKeyContext.close();

  await page.getByRole("tab", { name: "Webhooks" }).click();
  await page.getByRole("button", { name: /new webhook/i }).click();
  const webhookUrl = "https://hooks.example.com/flowdesk-walkthrough";
  await page.getByLabel("Target URL").fill(webhookUrl);
  await page.getByRole("button", { name: "invoice.paid", exact: true }).click();
  const webhook = await expectSuccessfulApiAction(
    page,
    "POST",
    "/webhooks",
    () => page.getByRole("button", { name: /create webhook/i }).click(),
  );
  const webhookData = await webhook.json();
  expect(webhookData.target_url).toBe(webhookUrl);
  await expect(page.getByText(webhookUrl)).toBeVisible();
  const pausedWebhook = await expectSuccessfulApiAction(
    page,
    "PATCH",
    "/webhooks/" + webhookData.id,
    () => page.getByRole("button", { name: "Pause" }).click(),
  );
  expect((await pausedWebhook.json()).is_active).toBe(false);
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();
  const activeWebhook = await expectSuccessfulApiAction(
    page,
    "PATCH",
    "/webhooks/" + webhookData.id,
    () => page.getByRole("button", { name: "Activate" }).click(),
  );
  expect((await activeWebhook.json()).is_active).toBe(true);
  const deliveryHistory = page.waitForResponse((response) =>
    response.request().method() === "GET" &&
    new URL(response.url()).pathname === "/api/v1/webhooks/" + webhookData.id + "/deliveries",
  );
  await page.getByRole("button", { name: "Delivery history" }).click();
  expect((await deliveryHistory).ok()).toBeTruthy();
  await expect(page.getByText("No delivery attempts yet.")).toBeVisible();
  await capture(page, "19-settings-webhooks");

  // Verify deletion with a second disposable configuration; keep the primary webhook active.
  await page.getByRole("button", { name: "Hide delivery history" }).click();
  const disposableWebhookUrl = "https://hooks.example.com/flowdesk-delete-walkthrough";
  await page.getByRole("button", { name: /new webhook/i }).click();
  await page.getByLabel("Target URL").fill(disposableWebhookUrl);
  await page.getByRole("button", { name: "task.updated", exact: true }).click();
  const disposableWebhookResponse = await expectSuccessfulApiAction(
    page,
    "POST",
    "/webhooks",
    () => page.getByRole("button", { name: /create webhook/i }).click(),
  );
  const disposableWebhook = await disposableWebhookResponse.json();
  expect(disposableWebhook.target_url).toBe(disposableWebhookUrl);
  const deletedWebhook = await expectSuccessfulApiAction(
    page,
    "DELETE",
    "/webhooks/" + disposableWebhook.id,
    () => page.getByRole("button", { name: "Delete webhook " + disposableWebhookUrl }).click(),
  );
  expect((await deletedWebhook.json()).message).toMatch(/deleted/i);
  await expect(page.getByText(disposableWebhookUrl, { exact: true })).toHaveCount(0);
  await capture(page, "19b-settings-webhook-deleted");

  // Global search and notifications use the backend API, not an in-browser fixture.
  await page.keyboard.press("Control+k");
  const searchInput = page.getByPlaceholder(/search clients, projects/i);
  const searchResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "GET" &&
    new URL(response.url()).pathname === "/api/v1/search",
  );
  await searchInput.fill(projectName);
  const searchResponse = await searchResponsePromise;
  expect(searchResponse.ok()).toBeTruthy();
  await expect(page.getByText(projectName).first()).toBeVisible();
  await capture(page, "20-global-search");

  await page.keyboard.press("Escape");
  const activityResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "GET" &&
    new URL(response.url()).pathname === "/api/v1/activity",
  );
  await page.getByRole("link", { name: "Activity" }).click();
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
  const activityResponse = await activityResponsePromise;
  expect(activityResponse.ok()).toBeTruthy();
  const activityItems = await activityResponse.json();
  expect(activityItems.length).toBeGreaterThan(0);
  expect(activityItems.some((item: { entity_label?: string }) => item.entity_label === "walkthrough-evidence.txt")).toBeTruthy();
  await capture(page, "21-activity-feed");

  // Assign two real tasks to the invited member through the task-detail UI. The backend
  // creates notification rows; no notification records or API responses are mocked.
  await page.locator("nav").getByRole("link", { name: "Projects" }).click();
  await page.getByRole("link", { name: projectName, exact: true }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

  const assignTaskToInvitee = async (title: string) => {
    const createdResponse = await expectSuccessfulApiAction(
      page,
      "POST",
      "/tasks",
      async () => {
        const backlogColumn = page.locator("text=Backlog").locator("..").locator("..");
        await backlogColumn.getByRole("button", { name: /add task/i }).click();
        await page.getByPlaceholder("Task title...").fill(title);
        await page.getByRole("button", { name: "Create task" }).click();
      },
    );
    const createdTask = await createdResponse.json();
    expect(createdTask.title).toBe(title);
    await page.getByText(title).first().click();
    const assignmentResponse = await expectSuccessfulApiAction(
      page,
      "PATCH",
      "/tasks/" + createdTask.id,
      async () => {
        await page.getByRole("combobox", { name: "Assignee" }).click();
        await page.getByRole("option", { name: /FlowDesk Invited Member/ }).click();
      },
    );
    expect((await assignmentResponse.json()).assignee_id).toBe(invitedUserId);
    if (title === "Notification individual read") await capture(page, "06b-task-assigned");
    await page.keyboard.press("Escape");
    return createdTask;
  };

  const individualReadTask = await assignTaskToInvitee("Notification individual read");
  const markAllReadTask = await assignTaskToInvitee("Notification bulk read");

  // Reload the invitee session so its notification queries read the task-assignment rows
  // just created in PostgreSQL by the owner session.
  const inviteeNotificationListPromise = inviteePage.waitForResponse((response) =>
    response.request().method() === "GET" &&
    new URL(response.url()).pathname === "/api/v1/notifications",
  );
  await inviteePage.reload();
  const inviteeNotificationList = await inviteeNotificationListPromise;
  expect(inviteeNotificationList.ok()).toBeTruthy();
  const inviteeNotificationData = await inviteeNotificationList.json();
  const individualNotification = inviteeNotificationData.items.find(
    (item: { id: string; title: string }) => item.title.includes(individualReadTask.title),
  );
  const markAllNotification = inviteeNotificationData.items.find(
    (item: { id: string; title: string }) => item.title.includes(markAllReadTask.title),
  );
  if (!individualNotification || !markAllNotification) {
    throw new Error("Task assignment did not create both real invitee notifications.");
  }

  await inviteePage.locator("button:has(svg.lucide-bell)").click();
  await expect(inviteePage.getByText("Notifications")).toBeVisible();
  await expect(inviteePage.getByText(individualNotification.title, { exact: true })).toBeVisible();
  await expect(inviteePage.getByText(markAllNotification.title, { exact: true })).toBeVisible();
  await capture(inviteePage, "22-notifications");

  const individualRead = await expectSuccessfulApiAction(
    inviteePage,
    "POST",
    "/notifications/" + individualNotification.id + "/read",
    () => inviteePage.getByText(individualNotification.title, { exact: true }).click(),
  );
  expect((await individualRead.json()).is_read).toBe(true);
  await expect(inviteePage).toHaveURL(new RegExp("/app/projects/" + project.id + "$"));
  await expect(inviteePage.getByRole("heading", { name: projectName })).toBeVisible();

  await inviteePage.locator("button:has(svg.lucide-bell)").click();
  await expect(inviteePage.getByRole("button", { name: "Mark all read" })).toBeVisible();
  const allRead = await expectSuccessfulApiAction(
    inviteePage,
    "POST",
    "/notifications/read-all",
    () => inviteePage.getByRole("button", { name: "Mark all read" }).click(),
  );
  expect((await allRead.json()).message).toMatch(/marked as read/i);
  await expect(inviteePage.getByRole("button", { name: "Mark all read" })).toHaveCount(0);
  const finalNotificationState = await inviteePage.request.get("http://localhost:5173/api/v1/notifications", {
    headers: { Authorization: "Bearer " + (await inviteePage.evaluate(() => {
      const raw = localStorage.getItem("flowdesk-auth");
      return raw ? JSON.parse(raw).state?.accessToken ?? "" : "";
    })) },
  });
  expect(finalNotificationState.ok()).toBeTruthy();
  const finalNotificationItems = (await finalNotificationState.json()).items;
  expect(finalNotificationItems.find((item: { id: string }) => item.id === individualNotification.id)?.is_read).toBe(true);
  expect(finalNotificationItems.find((item: { id: string }) => item.id === markAllNotification.id)?.is_read).toBe(true);
  await capture(inviteePage, "23-notifications-read-state");
  await inviteeContext.close();

  // Project CRUD: create and edit a disposable project, then delete it through the confirmation UI.
  await page.locator("nav").getByRole("link", { name: "Projects" }).click();
  const disposableProjectName = "Project lifecycle cleanup";
  const disposableProjectResponse = await expectSuccessfulApiAction(
    page,
    "POST",
    "/projects",
    async () => {
      await page.getByRole("button", { name: "New project" }).click();
      await page.getByLabel("Name").fill(disposableProjectName);
      await page.getByLabel("Description").fill("Initial disposable project description");
      await page.getByLabel("Billing type").click();
      await page.getByRole("option", { name: "Non-billable", exact: true }).click();
      await page.getByRole("button", { name: "Create project" }).click();
    },
  );
  const disposableProject = await disposableProjectResponse.json();
  expect(disposableProject.name).toBe(disposableProjectName);
  expect(disposableProject.billing_type).toBe("non_billable");
  await page.getByText(disposableProjectName, { exact: true }).click();
  await expect(page.getByRole("heading", { name: disposableProjectName })).toBeVisible();
  const disposableProjectUpdate = await expectSuccessfulApiAction(
    page,
    "PATCH",
    "/projects/" + disposableProject.id,
    async () => {
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      const editDialog = page.getByRole("dialog");
      await editDialog.getByLabel("Description").fill("Updated disposable project description");
      await capture(page, "04c-project-edit-dialog");
      await editDialog.getByRole("button", { name: "Save changes" }).click();
    },
  );
  expect((await disposableProjectUpdate.json()).description).toBe("Updated disposable project description");
  const deleteProjectResponse = await expectSuccessfulApiAction(
    page,
    "DELETE",
    "/projects/" + disposableProject.id,
    async () => {
      await page.getByRole("button", { name: "Delete project", exact: true }).click();
      const confirmation = page.getByRole("dialog");
      await expect(confirmation.getByText("Delete this project?")).toBeVisible();
      await confirmation.getByRole("button", { name: "Delete project", exact: true }).click();
    },
  );
  expect((await deleteProjectResponse.json()).message).toMatch(/deleted/i);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByText(disposableProjectName, { exact: true })).toHaveCount(0);
  await capture(page, "04d-project-deleted");

  // Draft-invoice deletion is a separate lifecycle action; the main billing and paid
  // invoice records remain available for the PostgreSQL verification below.
  const disposableDraftInvoiceResponse = await expectSuccessfulApiAction(
    page,
    "POST",
    "/invoices",
    async () => {
      await page.locator("nav").getByRole("link", { name: "Invoices" }).click();
      await page.getByRole("button", { name: /new invoice/i }).click();
      await page.getByLabel("Client").click();
      await page.getByRole("option", { name: clientName }).click();
      await page.getByLabel(/description/i).first().fill("Disposable draft invoice");
      await page.getByLabel(/quantity/i).first().fill("1");
      await page.getByLabel(/unit price/i).first().fill("10");
      await page.getByRole("button", { name: /create invoice/i }).click();
    },
  );
  const disposableDraftInvoice = await disposableDraftInvoiceResponse.json();
  expect(disposableDraftInvoice.status).toBe("draft");
  const deletedDraftInvoice = await expectSuccessfulApiAction(
    page,
    "DELETE",
    "/invoices/" + disposableDraftInvoice.id,
    async () => {
      await page.getByRole("button", { name: "Delete invoice", exact: true }).click();
      const confirmation = page.getByRole("dialog");
      await expect(confirmation.getByText("Delete this invoice?")).toBeVisible();
      await confirmation.getByRole("button", { name: "Delete invoice", exact: true }).click();
    },
  );
  expect((await deletedDraftInvoice.json()).message).toMatch(/deleted/i);
  await expect(page.getByText(disposableDraftInvoice.invoice_number, { exact: true })).toHaveCount(0);
  await capture(page, "14c-invoice-draft-deleted");

  // Full password-recovery path: use the backend-generated email token in an untraced
  // browser context, reset the password, then prove the new password can authenticate.
  const passwordResetContext = await browser.newContext();
  const passwordResetPage = await passwordResetContext.newPage();
  await passwordResetPage.goto("http://localhost:5173/forgot-password");
  const passwordResetRequest = await expectSuccessfulApiAction(
    passwordResetPage,
    "POST",
    "/auth/forgot-password",
    async () => {
      await passwordResetPage.getByLabel("Email").fill(accountEmail);
      await passwordResetPage.getByRole("button", { name: "Send reset link" }).click();
    },
  );
  expect((await passwordResetRequest.json()).message).toMatch(/reset link/i);
  await expect(passwordResetPage.getByRole("heading", { name: "Check your email" })).toBeVisible();
  const readPasswordResetToken = async () => {
    const logText = await readFile(backendLogPath!, "utf8");
    const emailOffset = logText.lastIndexOf("to=" + accountEmail);
    if (emailOffset < 0) return "";
    const resetMail = logText.slice(emailOffset);
    return resetMail.match(/Reset your password: http:\/\/localhost:5173\/reset-password\?token=([A-Za-z0-9_-]+)/)?.[1] ?? "";
  };
  await expect.poll(readPasswordResetToken, { timeout: 15_000 }).not.toBe("");
  const passwordResetToken = await readPasswordResetToken();
  await passwordResetPage.goto("http://localhost:5173/reset-password?token=" + encodeURIComponent(passwordResetToken));
  await expect(passwordResetPage.getByRole("heading", { name: "Set a new password" })).toBeVisible();
  await capture(passwordResetPage, "24-valid-reset-token");
  const resetPassword = "Flowdesk-reset-password-456";
  const passwordResetResponse = await expectSuccessfulApiAction(
    passwordResetPage,
    "POST",
    "/auth/reset-password",
    async () => {
      await passwordResetPage.getByLabel("New password").fill(resetPassword);
      await passwordResetPage.getByRole("button", { name: "Reset password" }).click();
    },
  );
  expect((await passwordResetResponse.json()).message).toMatch(/reset successfully/i);
  await expect(passwordResetPage).toHaveURL(/\/login$/);
  await capture(passwordResetPage, "25-password-reset-success");
  const loginAfterReset = await expectSuccessfulApiAction(
    passwordResetPage,
    "POST",
    "/auth/login",
    async () => {
      await passwordResetPage.getByLabel("Email").fill(accountEmail);
      await passwordResetPage.getByLabel("Password").fill(resetPassword);
      await passwordResetPage.getByRole("button", { name: "Log in" }).click();
    },
  );
  expect(await loginAfterReset.json()).toHaveProperty("access_token");
  await expect(passwordResetPage).toHaveURL(/\/app\/dashboard$/);
  await expect(passwordResetPage.getByText("Overview")).toBeVisible();
  await capture(passwordResetPage, "26-login-after-reset");
  await passwordResetContext.close();

  // Sanity-check the browser actually crossed the frontend/API boundary for core workflows.
  for (const expectedPath of [
    "/api/v1/auth/register",
    "/api/v1/clients",
    "/api/v1/projects",
    "/api/v1/tasks",
    "/api/v1/time-entries/timer/start",
    "/api/v1/time-entries/timer/stop",
    "/api/v1/invoices",
    "/api/v1/tenants/invitations",
    "/api/v1/webhooks",
    "/api/v1/search",
  ]) {
    expect(
      observedApiResponses.some((r) => r.path === expectedPath && r.status >= 200 && r.status < 300),
      `Expected a successful real API response for ${expectedPath}`,
    ).toBeTruthy();
  }
});
