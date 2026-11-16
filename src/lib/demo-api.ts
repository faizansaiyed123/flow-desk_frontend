import { useAuthStore } from "@/stores/auth-store";

export const DEMO_MODE = import.meta.env.MODE !== "test" && import.meta.env.VITE_FLOWDESK_BROWSER_DEMO !== "false";
export const DEMO_PASSWORD = "Demo1234!";

type DemoOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  isFormData?: boolean;
};

type DemoState = {
  tenants: any[];
  users: any[];
  memberships: any[];
  clients: any[];
  projects: any[];
  tasks: any[];
  comments: any[];
  timeEntries: any[];
  invoices: any[];
  notifications: any[];
  activity: any[];
  invitations: any[];
  apiKeys: any[];
  webhooks: any[];
  webhookDeliveries: any[];
  attachments: any[];
};

const STORAGE_KEY = "flowdesk_browser_demo_v1";
const TENANT_MAIN = "tenant_northstar";
const TENANT_LABS = "tenant_flowdesk_labs";
const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"];

const makeId = (prefix: string) =>
  prefix + "_" + Math.random().toString(36).slice(2, 10);

const daysFromNow = (days: number, hour = 10) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  return value.toISOString();
};

const dateOnly = (days: number) => daysFromNow(days).slice(0, 10);

const roundMoney = (value: number) => Math.round(value * 100) / 100;

function createSeedData(): DemoState {
  const users = [
    { id: "user_owner", email: "alex@northstar.demo", full_name: "Alex Morgan", avatar_url: null, is_email_verified: true, created_at: daysFromNow(-180) },
    { id: "user_admin", email: "jordan@northstar.demo", full_name: "Jordan Lee", avatar_url: null, is_email_verified: true, created_at: daysFromNow(-120) },
    { id: "user_member", email: "sam@northstar.demo", full_name: "Sam Rivera", avatar_url: null, is_email_verified: true, created_at: daysFromNow(-90) },
    { id: "user_viewer", email: "taylor@northstar.demo", full_name: "Taylor Chen", avatar_url: null, is_email_verified: true, created_at: daysFromNow(-60) },
  ];

  const tenants = [
    { id: TENANT_MAIN, name: "Northstar Creative", slug: "northstar-creative", logo_url: null, plan: "pro", is_active: true, created_at: daysFromNow(-180) },
    { id: TENANT_LABS, name: "FlowDesk Labs", slug: "flowdesk-labs", logo_url: null, plan: "free", is_active: true, created_at: daysFromNow(-28) },
  ];

  const memberships = [
    { id: "membership_owner_main", user_id: "user_owner", tenant_id: TENANT_MAIN, role: "owner", created_at: daysFromNow(-180) },
    { id: "membership_admin_main", user_id: "user_admin", tenant_id: TENANT_MAIN, role: "admin", created_at: daysFromNow(-120) },
    { id: "membership_member_main", user_id: "user_member", tenant_id: TENANT_MAIN, role: "member", created_at: daysFromNow(-90) },
    { id: "membership_viewer_main", user_id: "user_viewer", tenant_id: TENANT_MAIN, role: "viewer", created_at: daysFromNow(-60) },
    { id: "membership_owner_labs", user_id: "user_owner", tenant_id: TENANT_LABS, role: "admin", created_at: daysFromNow(-28) },
  ];

  const clients = [
    { id: "client_aperture", tenant_id: TENANT_MAIN, name: "Aperture Studio", company: "Aperture Studio LLC", email: "hello@aperture.demo", phone: "+1 415 555 0182", address: "210 Market Street, San Francisco, CA", notes: "Brand strategy and digital product client. Prefers concise weekly updates.", is_archived: false, created_at: daysFromNow(-90), updated_at: daysFromNow(-2) },
    { id: "client_lumen", tenant_id: TENANT_MAIN, name: "Lumen & Co.", company: "Lumen & Co.", email: "projects@lumen.demo", phone: "+1 415 555 0144", address: "88 Townsend Street, San Francisco, CA", notes: "Website refresh and ongoing design support.", is_archived: false, created_at: daysFromNow(-72), updated_at: daysFromNow(-4) },
    { id: "client_fieldnote", tenant_id: TENANT_MAIN, name: "Fieldnote", company: "Fieldnote Goods", email: "studio@fieldnote.demo", phone: "+1 628 555 0108", address: "45 Valencia Street, San Francisco, CA", notes: "Quarterly campaign retainer.", is_archived: false, created_at: daysFromNow(-55), updated_at: daysFromNow(-3) },
    { id: "client_arc", tenant_id: TENANT_MAIN, name: "Arcwell Health", company: "Arcwell Health Inc.", email: "ops@arcwell.demo", phone: "+1 510 555 0133", address: "500 3rd Street, Oakland, CA", notes: "Mobile onboarding product work.", is_archived: false, created_at: daysFromNow(-31), updated_at: daysFromNow(-1) },
    { id: "client_old", tenant_id: TENANT_MAIN, name: "Old Pine Market", company: "Old Pine Market", email: "team@oldpine.demo", phone: null, address: null, notes: "Archived client record retained for reference.", is_archived: true, created_at: daysFromNow(-220), updated_at: daysFromNow(-75) },
    { id: "client_lab", tenant_id: TENANT_LABS, name: "Prototype Partners", company: "Prototype Partners", email: "hello@prototype.demo", phone: null, address: "Remote", notes: "FlowDesk Labs sample client.", is_archived: false, created_at: daysFromNow(-18), updated_at: daysFromNow(-2) },
  ];

  const projects = [
    { id: "project_brand", tenant_id: TENANT_MAIN, name: "Brand identity system", description: "Research, positioning, visual identity, and a complete brand handoff.", status: "active", client_id: "client_aperture", color: "#c6963e", billing_type: "hourly", hourly_rate: 145, fixed_budget: null, start_date: dateOnly(-32), due_date: dateOnly(12), is_archived: false, created_at: daysFromNow(-32), updated_at: daysFromNow(-1) },
    { id: "project_website", tenant_id: TENANT_MAIN, name: "Website refresh", description: "Redesign and implementation of the Lumen marketing website.", status: "active", client_id: "client_lumen", color: "#6c9bb8", billing_type: "hourly", hourly_rate: 125, fixed_budget: null, start_date: dateOnly(-18), due_date: dateOnly(21), is_archived: false, created_at: daysFromNow(-18), updated_at: daysFromNow(-1) },
    { id: "project_campaign", tenant_id: TENANT_MAIN, name: "Quarterly campaign", description: "Creative direction, landing page, and launch assets for the fall campaign.", status: "on_hold", client_id: "client_fieldnote", color: "#8aa783", billing_type: "fixed", hourly_rate: null, fixed_budget: 12500, start_date: dateOnly(-48), due_date: dateOnly(8), is_archived: false, created_at: daysFromNow(-48), updated_at: daysFromNow(-5) },
    { id: "project_mobile", tenant_id: TENANT_MAIN, name: "Patient onboarding app", description: "A mobile-first onboarding experience for Arcwell Health customers.", status: "planning", client_id: "client_arc", color: "#a78ac4", billing_type: "hourly", hourly_rate: 160, fixed_budget: null, start_date: dateOnly(3), due_date: dateOnly(45), is_archived: false, created_at: daysFromNow(-8), updated_at: daysFromNow(-2) },
    { id: "project_lab", tenant_id: TENANT_LABS, name: "Workspace prototype", description: "Internal design-system and workflow prototype.", status: "active", client_id: "client_lab", color: "#c6963e", billing_type: "non_billable", hourly_rate: null, fixed_budget: null, start_date: dateOnly(-10), due_date: dateOnly(20), is_archived: false, created_at: daysFromNow(-10), updated_at: daysFromNow(-1) },
  ];

  const tasks = [
    { id: "task_research", tenant_id: TENANT_MAIN, project_id: "project_brand", title: "Complete audience interviews", description: "Synthesize notes from the five customer interviews.", status: "done", priority: "high", assignee_id: "user_member", due_date: dateOnly(-8), position: 100, completed_at: daysFromNow(-7), estimated_hours: 6, created_at: daysFromNow(-28), updated_at: daysFromNow(-7) },
    { id: "task_moodboard", tenant_id: TENANT_MAIN, project_id: "project_brand", title: "Prepare visual directions", description: "Present three visual routes for stakeholder review.", status: "in_review", priority: "high", assignee_id: "user_admin", due_date: dateOnly(2), position: 200, completed_at: null, estimated_hours: 8, created_at: daysFromNow(-14), updated_at: daysFromNow(-1) },
    { id: "task_guidelines", tenant_id: TENANT_MAIN, project_id: "project_brand", title: "Draft brand guidelines", description: "Typography, color, spacing, imagery, and usage rules.", status: "todo", priority: "medium", assignee_id: "user_member", due_date: dateOnly(8), position: 100, completed_at: null, estimated_hours: 12, created_at: daysFromNow(-5), updated_at: daysFromNow(-2) },
    { id: "task_homepage", tenant_id: TENANT_MAIN, project_id: "project_website", title: "Approve homepage wireframe", description: "Confirm desktop and mobile page structure with the client.", status: "in_progress", priority: "urgent", assignee_id: "user_owner", due_date: dateOnly(1), position: 100, completed_at: null, estimated_hours: 5, created_at: daysFromNow(-12), updated_at: daysFromNow(0) },
    { id: "task_copy", tenant_id: TENANT_MAIN, project_id: "project_website", title: "Finalize homepage copy", description: "Incorporate client feedback into hero and product sections.", status: "todo", priority: "high", assignee_id: "user_member", due_date: dateOnly(5), position: 200, completed_at: null, estimated_hours: 4, created_at: daysFromNow(-9), updated_at: daysFromNow(-2) },
    { id: "task_mobile", tenant_id: TENANT_MAIN, project_id: "project_website", title: "Build responsive navigation", description: "Implement accessible navigation at mobile and tablet breakpoints.", status: "backlog", priority: "medium", assignee_id: null, due_date: dateOnly(14), position: 100, completed_at: null, estimated_hours: 7, created_at: daysFromNow(-6), updated_at: daysFromNow(-6) },
    { id: "task_campaign", tenant_id: TENANT_MAIN, project_id: "project_campaign", title: "Review campaign concept", description: "Waiting on client approval for the creative direction.", status: "todo", priority: "medium", assignee_id: "user_admin", due_date: dateOnly(-2), position: 100, completed_at: null, estimated_hours: 3, created_at: daysFromNow(-12), updated_at: daysFromNow(-3) },
    { id: "task_landing", tenant_id: TENANT_MAIN, project_id: "project_campaign", title: "Create launch landing page", description: "Build the landing page after concept approval.", status: "backlog", priority: "low", assignee_id: null, due_date: dateOnly(7), position: 200, completed_at: null, estimated_hours: 10, created_at: daysFromNow(-8), updated_at: daysFromNow(-8) },
    { id: "task_appflows", tenant_id: TENANT_MAIN, project_id: "project_mobile", title: "Map onboarding flows", description: "Outline sign-up, verification, and first-session flows.", status: "backlog", priority: "high", assignee_id: "user_owner", due_date: dateOnly(19), position: 100, completed_at: null, estimated_hours: 9, created_at: daysFromNow(-4), updated_at: daysFromNow(-4) },
    { id: "task_accessibility", tenant_id: TENANT_MAIN, project_id: "project_mobile", title: "Accessibility review", description: "Define keyboard and screen-reader requirements.", status: "backlog", priority: "medium", assignee_id: "user_viewer", due_date: dateOnly(25), position: 200, completed_at: null, estimated_hours: 5, created_at: daysFromNow(-3), updated_at: daysFromNow(-3) },
    { id: "task_lab", tenant_id: TENANT_LABS, project_id: "project_lab", title: "Prototype command palette", description: "Explore a global action and search palette.", status: "in_progress", priority: "medium", assignee_id: "user_owner", due_date: dateOnly(9), position: 100, completed_at: null, estimated_hours: 6, created_at: daysFromNow(-7), updated_at: daysFromNow(-1) },
  ];

  const timeEntries = [
    { id: "time_1", tenant_id: TENANT_MAIN, project_id: "project_brand", task_id: "task_research", user_id: "user_member", description: "Audience research and interview synthesis", started_at: daysFromNow(-6, 9), ended_at: daysFromNow(-6, 13), duration_minutes: 240, is_billable: true, is_invoiced: false, created_at: daysFromNow(-6) },
    { id: "time_2", tenant_id: TENANT_MAIN, project_id: "project_brand", task_id: "task_moodboard", user_id: "user_admin", description: "Visual direction exploration", started_at: daysFromNow(-4, 10), ended_at: daysFromNow(-4, 13), duration_minutes: 180, is_billable: true, is_invoiced: false, created_at: daysFromNow(-4) },
    { id: "time_3", tenant_id: TENANT_MAIN, project_id: "project_website", task_id: "task_homepage", user_id: "user_owner", description: "Homepage wireframe review", started_at: daysFromNow(-2, 9), ended_at: daysFromNow(-2, 12), duration_minutes: 180, is_billable: true, is_invoiced: true, created_at: daysFromNow(-2) },
    { id: "time_4", tenant_id: TENANT_MAIN, project_id: "project_campaign", task_id: "task_campaign", user_id: "user_member", description: "Campaign planning", started_at: daysFromNow(-1, 11), ended_at: daysFromNow(-1, 13), duration_minutes: 120, is_billable: false, is_invoiced: false, created_at: daysFromNow(-1) },
  ];

  const makeLine = (id: string, description: string, quantity: number, unit_price: number, position: number) => ({
    id, description, quantity, unit_price, amount: roundMoney(quantity * unit_price), position,
  });

  const invoices = [
    { id: "invoice_paid", tenant_id: TENANT_MAIN, invoice_number: "INV-0008", client_id: "client_aperture", project_id: "project_brand", status: "paid", issue_date: dateOnly(-25), due_date: dateOnly(-10), subtotal: 870, tax_rate: 8.5, tax_amount: 73.95, total: 943.95, notes: "Brand research milestone.", paid_at: dateOnly(-12), line_items: [makeLine("line_paid_1", "Brand research and discovery", 6, 145, 1)], created_at: daysFromNow(-25) },
    { id: "invoice_sent", tenant_id: TENANT_MAIN, invoice_number: "INV-0009", client_id: "client_lumen", project_id: "project_website", status: "sent", issue_date: dateOnly(-8), due_date: dateOnly(22), subtotal: 625, tax_rate: 8.5, tax_amount: 53.13, total: 678.13, notes: "Homepage wireframe milestone.", paid_at: null, line_items: [makeLine("line_sent_1", "UX and homepage wireframes", 5, 125, 1)], created_at: daysFromNow(-8) },
    { id: "invoice_overdue", tenant_id: TENANT_MAIN, invoice_number: "INV-0010", client_id: "client_fieldnote", project_id: "project_campaign", status: "overdue", issue_date: dateOnly(-35), due_date: dateOnly(-5), subtotal: 1200, tax_rate: 8.5, tax_amount: 102, total: 1302, notes: "Monthly creative retainer.", paid_at: null, line_items: [makeLine("line_overdue_1", "Campaign creative retainer", 1, 1200, 1)], created_at: daysFromNow(-35) },
    { id: "invoice_draft", tenant_id: TENANT_MAIN, invoice_number: "INV-0011", client_id: "client_aperture", project_id: "project_brand", status: "draft", issue_date: dateOnly(0), due_date: dateOnly(30), subtotal: 0, tax_rate: 8.5, tax_amount: 0, total: 0, notes: "Draft prepared from unbilled time.", paid_at: null, line_items: [], created_at: daysFromNow(-1) },
  ];

  const now = new Date().toISOString();
  return {
    tenants, users, memberships, clients, projects, tasks, timeEntries, invoices,
    comments: [
      { id: "comment_1", tenant_id: TENANT_MAIN, task_id: "task_moodboard", author_id: "user_admin", body: "First direction is ready for a quick review.", created_at: daysFromNow(-1) },
      { id: "comment_2", tenant_id: TENANT_MAIN, task_id: "task_moodboard", author_id: "user_owner", body: "The warmer palette is closest to the brief. Please refine that route.", created_at: daysFromNow(0) },
      { id: "comment_3", tenant_id: TENANT_MAIN, task_id: "task_homepage", author_id: "user_member", body: "Mobile layout is ready for feedback.", created_at: daysFromNow(-1) },
    ],
    notifications: [
      { id: "notification_1", tenant_id: TENANT_MAIN, type: "task.assigned", title: "A task is waiting for review", body: "Visual directions are ready for your feedback.", link: "/app/projects/project_brand", is_read: false, created_at: daysFromNow(-1) },
      { id: "notification_2", tenant_id: TENANT_MAIN, type: "invoice.overdue", title: "Invoice INV-0010 is overdue", body: "Fieldnote has an outstanding invoice of $1,302.00.", link: "/app/invoices/invoice_overdue", is_read: false, created_at: daysFromNow(-1) },
      { id: "notification_3", tenant_id: TENANT_MAIN, type: "project.updated", title: "Website refresh updated", body: "The project was updated yesterday.", link: "/app/projects/project_website", is_read: true, created_at: daysFromNow(-2) },
    ],
    activity: [
      { id: "activity_1", tenant_id: TENANT_MAIN, actor_id: "user_member", action: "task.completed", entity_type: "task", entity_id: "task_research", entity_label: "Complete audience interviews", metadata_json: null, created_at: daysFromNow(-1) },
      { id: "activity_2", tenant_id: TENANT_MAIN, actor_id: "user_admin", action: "comment.created", entity_type: "task", entity_id: "task_moodboard", entity_label: "Visual directions", metadata_json: null, created_at: daysFromNow(-1) },
      { id: "activity_3", tenant_id: TENANT_MAIN, actor_id: "user_owner", action: "invoice.sent", entity_type: "invoice", entity_id: "invoice_sent", entity_label: "INV-0009", metadata_json: null, created_at: daysFromNow(-8) },
      { id: "activity_4", tenant_id: TENANT_MAIN, actor_id: "user_owner", action: "project.created", entity_type: "project", entity_id: "project_mobile", entity_label: "Patient onboarding app", metadata_json: null, created_at: daysFromNow(-8) },
    ],
    invitations: [
      { id: "invite_pending", tenant_id: TENANT_MAIN, email: "new.collaborator@northstar.demo", role: "member", status: "pending", expires_at: daysFromNow(6), created_at: daysFromNow(-1) },
    ],
    apiKeys: [
      { id: "key_1", tenant_id: TENANT_MAIN, name: "Local reporting integration", key_prefix: "fd_demo_8a3", is_active: true, last_used_at: daysFromNow(-2), created_at: daysFromNow(-30) },
    ],
    webhooks: [
      { id: "webhook_1", tenant_id: TENANT_MAIN, target_url: "https://example.test/flowdesk-events", events: ["task.completed", "invoice.paid"], description: "Sample analytics integration", is_active: true, created_at: daysFromNow(-15) },
    ],
    webhookDeliveries: [
      { id: "delivery_1", tenant_id: TENANT_MAIN, webhook_id: "webhook_1", event: "task.completed", response_status: 200, success: true, attempted_at: daysFromNow(-1) },
    ],
    attachments: [
      { id: "attachment_1", tenant_id: TENANT_MAIN, project_id: "project_brand", task_id: null, uploaded_by_id: "user_owner", file_name: "brand-discovery-brief.pdf", content_type: "application/pdf", size_bytes: 284100, created_at: daysFromNow(-8) },
      { id: "attachment_2", tenant_id: TENANT_MAIN, project_id: "project_website", task_id: "task_homepage", uploaded_by_id: "user_admin", file_name: "homepage-wireframe.png", content_type: "image/png", size_bytes: 512400, created_at: daysFromNow(-2) },
    ],
  };
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    // Replace an invalid local snapshot with clean sample data.
  }
  const state = createSeedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function persistState(state: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetDemoData() {
  persistState(createSeedData());
  useAuthStore.getState().logout();
}

function currentIdentity() {
  const token = useAuthStore.getState().accessToken;
  if (!token) return { user: null, tenantId: TENANT_MAIN };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { user: payload.sub as string, tenantId: payload.tenant_id as string };
  } catch {
    return { user: null, tenantId: TENANT_MAIN };
  }
}

function tokenPair(userId: string, tenantId: string) {
  const payload = btoa(JSON.stringify({ sub: userId, tenant_id: tenantId }));
  return { access_token: "demo." + payload + ".local", refresh_token: "demo-refresh." + payload + ".local" };
}

function currentUser(state: DemoState) {
  const identity = currentIdentity();
  return state.users.find((user) => user.id === identity.user) ?? null;
}

function currentTenantId() {
  return currentIdentity().tenantId || TENANT_MAIN;
}

function inTenant<T extends { tenant_id: string }>(items: T[], tenantId = currentTenantId()) {
  return items.filter((item) => item.tenant_id === tenantId);
}

function page<T>(items: T[], params: DemoOptions["params"] = {}) {
  const pageNumber = Math.max(1, Number(params?.page ?? 1));
  const pageSize = Math.max(1, Number(params?.page_size ?? 20));
  const start = (pageNumber - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: pageNumber,
    page_size: pageSize,
    total_pages: Math.ceil(items.length / pageSize),
  };
}

function withClientStats(state: DemoState, client: any) {
  const projects = inTenant(state.projects).filter((project) => project.client_id === client.id);
  const invoices = inTenant(state.invoices).filter((invoice) => invoice.client_id === client.id);
  return {
    ...client,
    project_count: projects.length,
    active_project_count: projects.filter((project) => project.status === "active").length,
    total_invoiced: roundMoney(invoices.reduce((sum, invoice) => sum + invoice.total, 0)),
    total_outstanding: roundMoney(invoices.filter((invoice) => ["sent", "overdue"].includes(invoice.status)).reduce((sum, invoice) => sum + invoice.total, 0)),
  };
}

function withProjectStats(state: DemoState, project: any) {
  const tasks = inTenant(state.tasks).filter((task) => task.project_id === project.id);
  const entries = inTenant(state.timeEntries).filter((entry) => entry.project_id === project.id);
  const minutes = entries.reduce((sum, entry) => sum + (entry.duration_minutes ?? 0), 0);
  const billable = entries.filter((entry) => entry.is_billable).reduce((sum, entry) => sum + ((entry.duration_minutes ?? 0) / 60) * Number(project.hourly_rate ?? 0), 0);
  return {
    ...project,
    client_name: inTenant(state.clients).find((client) => client.id === project.client_id)?.name ?? null,
    task_count: tasks.length,
    completed_task_count: tasks.filter((task) => task.status === "done").length,
    total_hours_logged: roundMoney(minutes / 60),
    total_billable_amount: roundMoney(billable),
  };
}

function recordActivity(state: DemoState, action: string, entityType: string, entityId: string, label: string) {
  const user = currentUser(state);
  state.activity.unshift({
    id: makeId("activity"),
    tenant_id: currentTenantId(),
    actor_id: user?.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_label: label,
    metadata_json: null,
    created_at: new Date().toISOString(),
  });
}

function dashboardSummary(state: DemoState) {
  const projects = inTenant(state.projects).filter((project) => !project.is_archived);
  const clients = inTenant(state.clients).filter((client) => !client.is_archived);
  const tasks = inTenant(state.tasks);
  const entries = inTenant(state.timeEntries);
  const invoices = inTenant(state.invoices);
  const overdue = tasks.filter((task) => task.status !== "done" && task.due_date && task.due_date < dateOnly(0));
  const recentEntries = entries.filter((entry) => new Date(entry.started_at).getTime() >= Date.now() - 7 * 86400000);
  const projectHealth = projects.map((project) => {
    const stats = withProjectStats(state, project);
    return {
      id: project.id,
      name: project.name,
      color: project.color,
      status: project.status,
      task_count: stats.task_count,
      completed_task_count: stats.completed_task_count,
      percent_complete: stats.task_count ? Math.round((stats.completed_task_count / stats.task_count) * 100) : 0,
      due_date: project.due_date,
    };
  });
  const upcoming = tasks
    .filter((task) => task.status !== "done" && task.due_date)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 6)
    .map((task) => ({
      id: task.id,
      title: task.title,
      project_id: task.project_id,
      project_name: projects.find((project) => project.id === task.project_id)?.name ?? "Project",
      due_date: task.due_date,
      priority: task.priority,
    }));
  const revenue = Array.from({ length: 6 }, (_, index) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - index), 1);
    const month = d.toLocaleString("en-US", { month: "short" });
    const invoiced = [3200, 4600, 3900, 5400, 6100, 7200][index];
    const collected = [2900, 4100, 3600, 4900, 5700, 6400][index];
    return { month, invoiced, collected };
  });
  return {
    active_project_count: projects.filter((project) => project.status === "active").length,
    total_client_count: clients.length,
    total_task_count: tasks.length,
    overdue_task_count: overdue.length,
    completed_tasks_last_7_days: tasks.filter((task) => task.status === "done" && new Date(task.updated_at).getTime() >= Date.now() - 7 * 86400000).length,
    hours_logged_last_7_days: roundMoney(recentEntries.reduce((sum, entry) => sum + (entry.duration_minutes ?? 0), 0) / 60),
    outstanding_invoice_total: roundMoney(invoices.filter((invoice) => ["sent", "overdue"].includes(invoice.status)).reduce((sum, invoice) => sum + invoice.total, 0)),
    paid_invoice_total_this_month: roundMoney(invoices.filter((invoice) => invoice.status === "paid" && invoice.paid_at?.slice(0, 7) === dateOnly(0).slice(0, 7)).reduce((sum, invoice) => sum + invoice.total, 0)),
    project_health: projectHealth,
    upcoming_tasks: upcoming,
    revenue_by_month: revenue,
  };
}

function makeInvoice(state: DemoState, payload: any) {
  const lineItems = (payload.line_items ?? []).map((item: any, index: number) => ({
    id: makeId("line"),
    description: item.description,
    quantity: Number(item.quantity ?? 1),
    unit_price: Number(item.unit_price ?? 0),
    amount: roundMoney(Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)),
    position: index + 1,
  }));
  const subtotal = roundMoney(lineItems.reduce((sum: number, item: any) => sum + item.amount, 0));
  const taxRate = Number(payload.tax_rate ?? 0);
  const taxAmount = roundMoney(subtotal * taxRate / 100);
  const invoice = {
    id: makeId("invoice"),
    tenant_id: currentTenantId(),
    invoice_number: "INV-" + String(12 + inTenant(state.invoices).length).padStart(4, "0"),
    client_id: payload.client_id,
    project_id: payload.project_id ?? null,
    status: "draft",
    issue_date: payload.issue_date ?? dateOnly(0),
    due_date: payload.due_date ?? dateOnly(30),
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total: roundMoney(subtotal + taxAmount),
    notes: payload.notes ?? null,
    paid_at: null,
    line_items: lineItems,
    created_at: new Date().toISOString(),
  };
  state.invoices.push(invoice);
  recordActivity(state, "invoice.created", "invoice", invoice.id, invoice.invoice_number);
  return invoice;
}

export async function demoRequest<T>(path: string, options: DemoOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const body = (options.body ?? {}) as any;
  const params = options.params ?? {};
  const query = String(params.search ?? params.q ?? "").toLowerCase();
  const tenantId = currentTenantId();
  const state = loadState();
  const user = currentUser(state);
  const persist = <R,>(value: R) => {
    persistState(state);
    return JSON.parse(JSON.stringify(value)) as R;
  };
  const today = new Date().toISOString();

  if (method === "GET" && path === "/health") return { status: "ok", environment: "browser-demo" } as T;

  if (path === "/auth/login" && method === "POST") {
    const selected = state.users.find((item) => item.email.toLowerCase() === String(body.email ?? "").trim().toLowerCase());
    if (!selected || body.password !== DEMO_PASSWORD) throw new Error("Use one of the sample demo accounts and password Demo1234!.");
    const membership = state.memberships.find((item) => item.user_id === selected.id);
    if (!membership) throw new Error("This demo account has no workspace membership.");
    return tokenPair(selected.id, membership.tenant_id) as T;
  }
  if (path === "/auth/register" && method === "POST") {
    const email = String(body.email ?? "").toLowerCase();
    if (state.users.some((item) => item.email === email)) throw new Error("An account with this email already exists.");
    const newUser = { id: makeId("user"), email, full_name: body.full_name, avatar_url: null, is_email_verified: true, created_at: today };
    const tenant = { id: makeId("tenant"), name: body.workspace_name || "My Workspace", slug: makeId("workspace"), logo_url: null, plan: "free", is_active: true, created_at: today };
    state.users.push(newUser);
    state.tenants.push(tenant);
    state.memberships.push({ id: makeId("membership"), user_id: newUser.id, tenant_id: tenant.id, role: "owner", created_at: today });
    persistState(state);
    return tokenPair(newUser.id, tenant.id) as T;
  }
  if (path === "/auth/me" && method === "GET") {
    if (!user) throw new Error("Not authenticated.");
    const memberships = state.memberships.filter((membership) => membership.user_id === user.id).map((membership) => ({
      id: membership.id,
      role: membership.role,
      tenant_id: membership.tenant_id,
      user: { ...user },
    }));
    return { user, memberships } as T;
  }
  if (path === "/auth/refresh" && method === "POST") {
    if (!user) throw new Error("Session expired. Please log in again.");
    return tokenPair(user.id, tenantId) as T;
  }
  if (path === "/auth/switch-tenant" && method === "POST") {
    if (!user || !state.memberships.some((membership) => membership.user_id === user.id && membership.tenant_id === body.tenant_id)) {
      throw new Error("You are not a member of that workspace.");
    }
    return tokenPair(user.id, body.tenant_id) as T;
  }

  if (path === "/users/me" && method === "PATCH") {
    if (!user) throw new Error("Not authenticated.");
    Object.assign(user, body);
    return persist(user) as T;
  }

  if (path === "/tenants/current" && method === "GET") {
    return (state.tenants.find((tenant) => tenant.id === tenantId) ?? {}) as T;
  }
  if (path === "/tenants/current" && method === "PATCH") {
    const tenant = state.tenants.find((item) => item.id === tenantId);
    if (!tenant) throw new Error("Workspace not found.");
    Object.assign(tenant, body);
    return persist(tenant) as T;
  }
  if (path === "/tenants/members" && method === "GET") {
    return state.memberships.filter((membership) => membership.tenant_id === tenantId).map((membership) => ({
      membership_id: membership.id,
      user: state.users.find((item) => item.id === membership.user_id),
      role: membership.role,
      joined_at: membership.created_at,
    })) as T;
  }
  let match = path.match(/^\/tenants\/members\/([^/]+)\/role$/);
  if (match && method === "PATCH") {
    const membership = state.memberships.find((item) => item.id === match![1] && item.tenant_id === tenantId);
    if (!membership) throw new Error("Workspace member not found.");
    if (membership.role === "owner") throw new Error("The workspace owner role cannot be changed in this demo.");
    membership.role = body.role;
    recordActivity(state, "membership.role_updated", "membership", membership.id, "Workspace member role");
    return persist(membership) as T;
  }
  match = path.match(/^\/tenants\/members\/([^/]+)$/);
  if (match && method === "DELETE") {
    state.memberships = state.memberships.filter((item) => item.id !== match![1] || item.tenant_id !== tenantId);
    return persist({ message: "Member removed." }) as T;
  }
  if (path === "/tenants/invitations" && method === "GET") return inTenant(state.invitations) as T;
  if (path === "/tenants/invitations" && method === "POST") {
    const invitation = { id: makeId("invite"), tenant_id: tenantId, email: body.email, role: body.role, status: "pending", expires_at: daysFromNow(7), created_at: today };
    state.invitations.push(invitation);
    recordActivity(state, "invitation.created", "invitation", invitation.id, invitation.email);
    return persist(invitation) as T;
  }
  match = path.match(/^\/tenants\/invitations\/([^/]+)$/);
  if (match && method === "DELETE") {
    const invitation = state.invitations.find((item) => item.id === match![1] && item.tenant_id === tenantId);
    if (invitation) invitation.status = "revoked";
    return persist({ message: "Invitation revoked." }) as T;
  }

  if (path === "/clients" && method === "GET") {
    let items = inTenant(state.clients).filter((client) => params.include_archived || !client.is_archived);
    if (query) items = items.filter((client) => [client.name, client.company, client.email].join(" ").toLowerCase().includes(query));
    return page(items, params) as T;
  }
  if (path === "/clients" && method === "POST") {
    const client = { id: makeId("client"), tenant_id: tenantId, name: body.name, company: body.company ?? null, email: body.email ?? null, phone: body.phone ?? null, address: body.address ?? null, notes: body.notes ?? null, is_archived: false, created_at: today, updated_at: today };
    state.clients.push(client);
    recordActivity(state, "client.created", "client", client.id, client.name);
    return persist(client) as T;
  }
  match = path.match(/^\/clients\/([^/]+)\/archive$/);
  if (match && method === "POST") {
    const client = inTenant(state.clients).find((item) => item.id === match![1]);
    if (!client) throw new Error("Client not found.");
    client.is_archived = true; client.updated_at = today;
    recordActivity(state, "client.archived", "client", client.id, client.name);
    return persist(client) as T;
  }
  match = path.match(/^\/clients\/([^/]+)$/);
  if (match && method === "GET") {
    const client = inTenant(state.clients).find((item) => item.id === match![1]);
    if (!client) throw new Error("Client not found.");
    return withClientStats(state, client) as T;
  }
  if (match && method === "PATCH") {
    const client = inTenant(state.clients).find((item) => item.id === match![1]);
    if (!client) throw new Error("Client not found.");
    Object.assign(client, body, { updated_at: today });
    recordActivity(state, "client.updated", "client", client.id, client.name);
    return persist(client) as T;
  }
  if (match && method === "DELETE") {
    const index = state.clients.findIndex((item) => item.id === match![1] && item.tenant_id === tenantId);
    if (index < 0) throw new Error("Client not found.");
    state.clients.splice(index, 1);
    return persist({ message: "Client deleted." }) as T;
  }

  if (path === "/projects" && method === "GET") {
    let items = inTenant(state.projects).filter((project) => !project.is_archived);
    if (query) items = items.filter((project) => project.name.toLowerCase().includes(query));
    if (params.status) items = items.filter((project) => project.status === params.status);
    if (params.client_id) items = items.filter((project) => project.client_id === params.client_id);
    return page(items.map((project) => withProjectStats(state, project)), params) as T;
  }
  if (path === "/projects" && method === "POST") {
    const project = { id: makeId("project"), tenant_id: tenantId, name: body.name, description: body.description ?? null, status: body.status ?? "planning", client_id: body.client_id ?? null, color: body.color ?? "#c6963e", billing_type: body.billing_type ?? "hourly", hourly_rate: body.hourly_rate ?? null, fixed_budget: body.fixed_budget ?? null, start_date: body.start_date ?? dateOnly(0), due_date: body.due_date ?? null, is_archived: false, created_at: today, updated_at: today };
    state.projects.push(project);
    recordActivity(state, "project.created", "project", project.id, project.name);
    return persist(withProjectStats(state, project)) as T;
  }
  match = path.match(/^\/projects\/([^/]+)$/);
  if (match && method === "GET") {
    const project = inTenant(state.projects).find((item) => item.id === match![1]);
    if (!project) throw new Error("Project not found.");
    return withProjectStats(state, project) as T;
  }
  if (match && method === "PATCH") {
    const project = inTenant(state.projects).find((item) => item.id === match![1]);
    if (!project) throw new Error("Project not found.");
    Object.assign(project, body, { updated_at: today });
    recordActivity(state, "project.updated", "project", project.id, project.name);
    return persist(withProjectStats(state, project)) as T;
  }
  if (match && method === "DELETE") {
    const index = state.projects.findIndex((item) => item.id === match![1] && item.tenant_id === tenantId);
    if (index < 0) throw new Error("Project not found.");
    state.projects.splice(index, 1);
    state.tasks = state.tasks.filter((task) => task.project_id !== match![1]);
    return persist({ message: "Project deleted." }) as T;
  }

  match = path.match(/^\/tasks\/board\/([^/]+)$/);
  if (match && method === "GET") {
    if (!inTenant(state.projects).some((project) => project.id === match![1])) throw new Error("Project not found.");
    return { columns: STATUSES.map((status) => ({ status, tasks: inTenant(state.tasks).filter((task) => task.project_id === match![1] && task.status === status).sort((a, b) => a.position - b.position) })) } as T;
  }
  if (path === "/tasks" && method === "POST") {
    if (!inTenant(state.projects).some((project) => project.id === body.project_id)) throw new Error("Project not found.");
    const siblings = inTenant(state.tasks).filter((task) => task.project_id === body.project_id && task.status === (body.status ?? "todo"));
    const task = { id: makeId("task"), tenant_id: tenantId, project_id: body.project_id, title: body.title, description: body.description ?? null, status: body.status ?? "todo", priority: body.priority ?? "medium", assignee_id: body.assignee_id ?? null, due_date: body.due_date ?? null, position: siblings.length ? Math.max(...siblings.map((item) => item.position)) + 100 : 100, completed_at: null, estimated_hours: body.estimated_hours ?? null, created_at: today, updated_at: today };
    state.tasks.push(task);
    recordActivity(state, "task.created", "task", task.id, task.title);
    return persist(task) as T;
  }
  match = path.match(/^\/tasks\/([^/]+)\/move$/);
  if (match && method === "PATCH") {
    const task = inTenant(state.tasks).find((item) => item.id === match![1]);
    if (!task) throw new Error("Task not found.");
    task.status = body.status;
    task.position = Number(body.position ?? task.position);
    task.completed_at = task.status === "done" ? (task.completed_at ?? today) : null;
    task.updated_at = today;
    recordActivity(state, "task.moved", "task", task.id, task.title);
    return persist(task) as T;
  }
  match = path.match(/^\/tasks\/([^/]+)\/comments$/);
  if (match && method === "GET") return inTenant(state.comments).filter((comment) => comment.task_id === match![1]) as T;
  if (match && method === "POST") {
    const task = inTenant(state.tasks).find((item) => item.id === match![1]);
    if (!task) throw new Error("Task not found.");
    const comment = { id: makeId("comment"), tenant_id: tenantId, task_id: task.id, author_id: user?.id ?? "user_owner", body: body.body, created_at: today };
    state.comments.push(comment);
    recordActivity(state, "comment.created", "task", task.id, task.title);
    return persist(comment) as T;
  }
  match = path.match(/^\/tasks\/([^/]+)$/);
  if (match && method === "GET") {
    const task = inTenant(state.tasks).find((item) => item.id === match![1]);
    if (!task) throw new Error("Task not found.");
    return task as T;
  }
  if (match && method === "PATCH") {
    const task = inTenant(state.tasks).find((item) => item.id === match![1]);
    if (!task) throw new Error("Task not found.");
    Object.assign(task, body, { updated_at: today });
    if (task.status === "done" && !task.completed_at) task.completed_at = today;
    if (task.status !== "done") task.completed_at = null;
    recordActivity(state, "task.updated", "task", task.id, task.title);
    return persist(task) as T;
  }
  if (match && method === "DELETE") {
    const task = inTenant(state.tasks).find((item) => item.id === match![1]);
    if (!task) throw new Error("Task not found.");
    state.tasks = state.tasks.filter((item) => item.id !== task.id);
    state.comments = state.comments.filter((item) => item.task_id !== task.id);
    return persist({ message: "Task deleted." }) as T;
  }

  if (path === "/time-entries" && method === "GET") {
    let items = inTenant(state.timeEntries);
    if (params.project_id) items = items.filter((item) => item.project_id === params.project_id);
    if (params.user_id) items = items.filter((item) => item.user_id === params.user_id);
    if (params.is_invoiced !== undefined) items = items.filter((item) => item.is_invoiced === Boolean(params.is_invoiced));
    return page(items.sort((a, b) => b.started_at.localeCompare(a.started_at)), params) as T;
  }
  if (path === "/time-entries/timer/running" && method === "GET") {
    return (inTenant(state.timeEntries).find((entry) => entry.user_id === user?.id && !entry.ended_at) ?? null) as T;
  }
  if (path === "/time-entries/timer/start" && method === "POST") {
    if (inTenant(state.timeEntries).some((entry) => entry.user_id === user?.id && !entry.ended_at)) throw new Error("You already have a running timer.");
    const entry = { id: makeId("time"), tenant_id: tenantId, project_id: body.project_id, task_id: body.task_id ?? null, user_id: user?.id ?? "user_owner", description: body.description ?? null, started_at: today, ended_at: null, duration_minutes: null, is_billable: true, is_invoiced: false, created_at: today };
    state.timeEntries.push(entry);
    recordActivity(state, "time.started", "time_entry", entry.id, entry.description ?? "Timer started");
    return persist(entry) as T;
  }
  if (path === "/time-entries/timer/stop" && method === "POST") {
    const entry = inTenant(state.timeEntries).find((item) => item.user_id === user?.id && !item.ended_at);
    if (!entry) throw new Error("No timer is running.");
    entry.ended_at = today;
    entry.duration_minutes = Math.max(1, Math.round((Date.now() - new Date(entry.started_at).getTime()) / 60000));
    recordActivity(state, "time.stopped", "time_entry", entry.id, entry.description ?? "Timer stopped");
    return persist(entry) as T;
  }
  if (path === "/time-entries" && method === "POST") {
    const startedAt = body.started_at ?? today;
    const endedAt = body.ended_at ?? null;
    const duration = body.duration_minutes ?? (endedAt ? Math.max(1, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)) : null);
    const entry = { id: makeId("time"), tenant_id: tenantId, project_id: body.project_id, task_id: body.task_id ?? null, user_id: user?.id ?? "user_owner", description: body.description ?? null, started_at: startedAt, ended_at: endedAt, duration_minutes: duration, is_billable: body.is_billable ?? true, is_invoiced: false, created_at: today };
    state.timeEntries.push(entry);
    recordActivity(state, "time.logged", "time_entry", entry.id, entry.description ?? "Time entry");
    return persist(entry) as T;
  }
  match = path.match(/^\/time-entries\/([^/]+)$/);
  if (match && method === "PATCH") {
    const entry = inTenant(state.timeEntries).find((item) => item.id === match![1]);
    if (!entry || entry.is_invoiced) throw new Error("Time entry not found or already invoiced.");
    Object.assign(entry, body);
    if (body.started_at || body.ended_at) entry.duration_minutes = entry.ended_at ? Math.max(1, Math.round((new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 60000)) : null;
    return persist(entry) as T;
  }
  if (match && method === "DELETE") {
    const entry = inTenant(state.timeEntries).find((item) => item.id === match![1]);
    if (!entry || entry.is_invoiced) throw new Error("Time entry not found or already invoiced.");
    state.timeEntries = state.timeEntries.filter((item) => item.id !== match![1]);
    return persist({ message: "Time entry deleted." }) as T;
  }

  if (path === "/invoices" && method === "GET") {
    let items = inTenant(state.invoices);
    if (params.status) items = items.filter((invoice) => invoice.status === params.status);
    if (params.client_id) items = items.filter((invoice) => invoice.client_id === params.client_id);
    return page(items.sort((a, b) => b.issue_date.localeCompare(a.issue_date)), params) as T;
  }
  if (path === "/invoices" && method === "POST") return persist(makeInvoice(state, body)) as T;
  if (path === "/invoices/generate-from-time" && method === "POST") {
    const project = inTenant(state.projects).find((item) => item.id === body.project_id);
    if (!project || project.billing_type !== "hourly" || !project.hourly_rate) throw new Error("Set an hourly rate on this project before generating an invoice.");
    const entries = inTenant(state.timeEntries).filter((entry) => entry.project_id === project.id && entry.is_billable && !entry.is_invoiced && entry.ended_at);
    if (!entries.length) throw new Error("There is no unbilled time available for this project.");
    const minutes = entries.reduce((sum, entry) => sum + (entry.duration_minutes ?? 0), 0);
    const invoice = makeInvoice(state, { client_id: project.client_id, project_id: project.id, issue_date: body.issue_date, due_date: body.due_date, tax_rate: body.tax_rate ?? 0, notes: body.notes ?? "Generated from unbilled time entries.", line_items: [{ description: "Project time (" + (minutes / 60).toFixed(2) + " hours)", quantity: roundMoney(minutes / 60), unit_price: Number(project.hourly_rate) }] });
    entries.forEach((entry) => { entry.is_invoiced = true; });
    return persist(invoice) as T;
  }
  match = path.match(/^\/invoices\/([^/]+)$/);
  if (match && method === "GET") {
    const invoice = inTenant(state.invoices).find((item) => item.id === match![1]);
    if (!invoice) throw new Error("Invoice not found.");
    return invoice as T;
  }
  if (match && method === "PATCH") {
    const invoice = inTenant(state.invoices).find((item) => item.id === match![1]);
    if (!invoice || invoice.status !== "draft") throw new Error("Only draft invoices can be edited.");
    Object.assign(invoice, body);
    if (body.line_items) {
      invoice.line_items = body.line_items.map((item: any, index: number) => ({
        id: makeId("line"), description: item.description, quantity: Number(item.quantity), unit_price: Number(item.unit_price), amount: roundMoney(Number(item.quantity) * Number(item.unit_price)), position: index + 1,
      }));
    }
    invoice.subtotal = roundMoney(invoice.line_items.reduce((sum: number, item: any) => sum + item.amount, 0));
    invoice.tax_amount = roundMoney(invoice.subtotal * Number(invoice.tax_rate) / 100);
    invoice.total = roundMoney(invoice.subtotal + invoice.tax_amount);
    return persist(invoice) as T;
  }
  match = path.match(/^\/invoices\/([^/]+)\/(send|mark-paid|void|mark-overdue)$/);
  if (match && method === "POST") {
    const invoice = inTenant(state.invoices).find((item) => item.id === match![1]);
    if (!invoice) throw new Error("Invoice not found.");
    const action = match![2];
    if (action === "send" && invoice.status !== "draft") throw new Error("Only a draft invoice can be sent.");
    if (action === "mark-paid" && !["sent", "overdue"].includes(invoice.status)) throw new Error("Only sent or overdue invoices can be marked paid.");
    if (action === "void" && ["paid", "void"].includes(invoice.status)) throw new Error("This invoice cannot be voided.");
    if (action === "mark-overdue" && invoice.status !== "sent") throw new Error("Only sent invoices can be marked overdue.");
    invoice.status = action === "mark-paid" ? "paid" : action === "mark-overdue" ? "overdue" : action === "void" ? "void" : "sent";
    if (action === "mark-paid") invoice.paid_at = dateOnly(0);
    recordActivity(state, "invoice." + invoice.status, "invoice", invoice.id, invoice.invoice_number);
    return persist(invoice) as T;
  }
  if (match && method === "DELETE") {
    const invoice = inTenant(state.invoices).find((item) => item.id === match![1]);
    if (!invoice || invoice.status !== "draft") throw new Error("Only draft invoices can be deleted.");
    state.invoices = state.invoices.filter((item) => item.id !== match![1]);
    state.timeEntries.forEach((entry) => {
      if (entry.is_invoiced && entry.project_id === invoice.project_id) entry.is_invoiced = false;
    });
    return persist({ message: "Invoice deleted." }) as T;
  }

  if (path === "/dashboard/summary" && method === "GET") return dashboardSummary(state) as T;
  if (path === "/activity" && method === "GET") {
    let items = inTenant(state.activity);
    if (params.entity_type) items = items.filter((entry) => entry.entity_type === params.entity_type);
    if (params.entity_id) items = items.filter((entry) => entry.entity_id === params.entity_id);
    return items.slice(0, Number(params.limit ?? 50)) as T;
  }
  if (path === "/notifications/unread-count" && method === "GET") return { count: inTenant(state.notifications).filter((item) => !item.is_read).length } as T;
  if (path === "/notifications" && method === "GET") {
    let items = inTenant(state.notifications);
    if (params.unread_only) items = items.filter((item) => !item.is_read);
    return page(items, params) as T;
  }
  match = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (match && method === "POST") {
    const notification = inTenant(state.notifications).find((item) => item.id === match![1]);
    if (notification) notification.is_read = true;
    return persist(notification ?? { message: "Notification updated." }) as T;
  }
  if (path === "/notifications/read-all" && method === "POST") {
    inTenant(state.notifications).forEach((item) => { item.is_read = true; });
    return persist({ message: "Notifications marked read." }) as T;
  }

  if (path === "/search" && method === "GET") {
    const q = String(params.q ?? "").toLowerCase();
    const results = [
      ...inTenant(state.clients).map((item) => ({ id: item.id, type: "client", title: item.name, subtitle: item.company, url: "/app/clients/" + item.id })),
      ...inTenant(state.projects).map((item) => ({ id: item.id, type: "project", title: item.name, subtitle: "Project", url: "/app/projects/" + item.id })),
      ...inTenant(state.tasks).map((item) => ({ id: item.id, type: "task", title: item.title, subtitle: "Task", url: "/app/projects/" + item.project_id })),
    ].filter((item) => item.title.toLowerCase().includes(q)).slice(0, 12);
    return { query: params.q ?? "", results } as T;
  }

  if (path === "/api-keys" && method === "GET") return inTenant(state.apiKeys) as T;
  if (path === "/api-keys" && method === "POST") {
    const key = { id: makeId("key"), tenant_id: tenantId, name: body.name, key_prefix: "fd_demo_" + Math.random().toString(36).slice(2, 6), is_active: true, last_used_at: null, created_at: today, plaintext_key: "fd_demo_local_only_" + makeId("secret") };
    state.apiKeys.push(key);
    return persist(key) as T;
  }
  match = path.match(/^\/api-keys\/([^/]+)$/);
  if (match && method === "DELETE") {
    const key = inTenant(state.apiKeys).find((item) => item.id === match![1]);
    if (key) key.is_active = false;
    return persist({ message: "API key revoked." }) as T;
  }

  if (path === "/webhooks" && method === "GET") return inTenant(state.webhooks) as T;
  if (path === "/webhooks" && method === "POST") {
    const webhook = { id: makeId("webhook"), tenant_id: tenantId, target_url: body.target_url, events: body.events ?? [], description: body.description ?? null, is_active: true, created_at: today, secret: "demo_secret_" + makeId("secret") };
    state.webhooks.push(webhook);
    return persist(webhook) as T;
  }
  match = path.match(/^\/webhooks\/([^/]+)\/deliveries$/);
  if (match && method === "GET") return inTenant(state.webhookDeliveries).filter((item) => item.webhook_id === match![1]) as T;
  match = path.match(/^\/webhooks\/([^/]+)$/);
  if (match && method === "PATCH") {
    const webhook = inTenant(state.webhooks).find((item) => item.id === match![1]);
    if (!webhook) throw new Error("Webhook not found.");
    Object.assign(webhook, body);
    return persist(webhook) as T;
  }
  if (match && method === "DELETE") {
    state.webhooks = state.webhooks.filter((item) => item.id !== match![1] || item.tenant_id !== tenantId);
    return persist({ message: "Webhook deleted." }) as T;
  }

  if (path === "/attachments" && method === "GET") return inTenant(state.attachments).filter((item) => !params.project_id || item.project_id === params.project_id) as T;
  if (path === "/attachments" && method === "POST") {
    const file = body instanceof FormData ? body.get("file") as File | null : null;
    const attachment = { id: makeId("attachment"), tenant_id: tenantId, project_id: String(params.project_id ?? ""), task_id: null, uploaded_by_id: user?.id ?? "user_owner", file_name: file?.name ?? "demo-attachment.txt", content_type: file?.type ?? "text/plain", size_bytes: file?.size ?? 0, created_at: today, simulated: true };
    state.attachments.push(attachment);
    recordActivity(state, "attachment.uploaded", "project", attachment.project_id, attachment.file_name);
    return persist(attachment) as T;
  }
  match = path.match(/^\/attachments\/([^/]+)$/);
  if (match && method === "DELETE") {
    state.attachments = state.attachments.filter((item) => item.id !== match![1] || item.tenant_id !== tenantId);
    return persist({ message: "Attachment deleted." }) as T;
  }

  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    return { message: "This action is represented locally in the demo.", simulated: true } as T;
  }
  if (method === "GET") return [] as T;
  return {} as T;
}
