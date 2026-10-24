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
  expect(await registration.json()).toHaveProperty("access_token");
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
      await page.getByRole("button", { name: "Create project" }).click();
    },
  );
  const project = await projectCreated.json();
  expect(project.name).toBe(projectName);
  await expect(page.getByText(projectName)).toBeVisible();
  await capture(page, "04-projects-list");

  await page.getByText(projectName).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByText("Backlog", { exact: true })).toBeVisible();

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

  const attachmentDownload = await expectSuccessfulApiAction(
    page,
    "GET",
    "/attachments/" + attachment.id + "/download",
    () => page.getByRole("button", { name: "Download walkthrough-evidence.txt" }).click(),
  );
  expect((await attachmentDownload.body()).toString("utf8")).toBe(attachmentContent);

  await expectSuccessfulApiAction(
    page,
    "POST",
    "/attachments",
    () => page.getByLabel("Upload project attachment").setInputFiles({
      name: "temporary-delete.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Delete this real upload after verifying the delete endpoint.", "utf8"),
    }),
  );
  await expect(page.getByText("temporary-delete.txt")).toBeVisible();
  await expectSuccessfulApiAction(
    page,
    "DELETE",
    "/attachments/" + (await page.getByText("temporary-delete.txt").evaluate((node) =>
      node.closest("[data-attachment-id]")?.getAttribute("data-attachment-id") ?? ""
    )),
    () => page.getByRole("button", { name: "Delete temporary-delete.txt" }).click(),
  );
  await expect(page.getByText("temporary-delete.txt")).not.toBeVisible();
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
    () => page.getByRole("button", { name: "Log time" }).click(),
  );
  const manualEntry = await manualTime.json();
  expect(manualEntry.duration_minutes).toBe(45);
  await expect(page.getByText("Manual verification entry edited")).toBeVisible();
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
  await expect(page.getByText("Manual verification entry")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Manual verification entry")).toBeVisible();
  await capture(page, "10-time-tracking-stopped-reloaded");

  // Invoice lifecycle: draft → sent → paid, followed by a fresh server read.
  await page.getByRole("link", { name: "Invoices" }).click();
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
  await page.getByRole("link", { name: "Invoices" }).click();
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
  await inviteeContext.close();

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

  await page.getByRole("tab", { name: /api keys/i }).click();
  await page.getByRole("button", { name: /new key/i }).click();
  await page.getByLabel("Name").fill("Walkthrough automation key");
  const apiKeyCreation = await expectSuccessfulApiAction(
    page,
    "POST",
    "/api-keys",
    () => page.getByRole("button", { name: /generate key/i }).click(),
  );
  // Read the response to ensure this was a real generated secret but never log or persist it.
  expect((await apiKeyCreation.json()).plaintext_key).toMatch(/^fd_live_/);
  await expect(page.getByRole("heading", { name: /copy your api key/i })).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Walkthrough automation key")).toBeVisible();
  await capture(page, "18-settings-api-keys");

  await page.getByRole("tab", { name: "Webhooks" }).click();
  await page.getByRole("button", { name: /new webhook/i }).click();
  const webhookUrl = "https://hooks.example.com/flowdesk-walkthrough";
  await page.getByLabel("Target URL").fill(webhookUrl);
  await page.getByRole("button", { name: "task.created", exact: true }).click();
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

  await page.locator("button:has(svg.lucide-bell)").click();
  await expect(page.getByText("Notifications")).toBeVisible();
  await expect.poll(() => observedApiResponses.some((r) => r.path === "/api/v1/notifications")).toBeTruthy();
  await expect.poll(() => observedApiResponses.some((r) => r.path === "/api/v1/notifications/unread-count")).toBeTruthy();
  await capture(page, "22-notifications");

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
    "/api/v1/api-keys",
    "/api/v1/webhooks",
    "/api/v1/search",
  ]) {
    expect(
      observedApiResponses.some((r) => r.path === expectedPath && r.status >= 200 && r.status < 300),
      `Expected a successful real API response for ${expectedPath}`,
    ).toBeTruthy();
  }
});
