export type MembershipRole = "owner" | "admin" | "member" | "viewer";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_email_verified: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  role: MembershipRole;
  tenant_id: string;
  user: User;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
}

export interface MeResponse {
  user: User;
  memberships: Membership[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  is_active: boolean;
  created_at: string;
}

export interface TeamMember {
  membership_id: string;
  user: User;
  role: MembershipRole;
  joined_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: MembershipRole;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientWithStats extends Client {
  project_count: number;
  active_project_count: number;
  total_invoiced: number;
  total_outstanding: number;
}

export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";
export type BillingType = "hourly" | "fixed" | "non_billable";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  client_id: string | null;
  color: string;
  billing_type: BillingType;
  hourly_rate: number | null;
  fixed_budget: number | null;
  start_date: string | null;
  due_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithStats extends Project {
  client_name: string | null;
  task_count: number;
  completed_task_count: number;
  total_hours_logged: number;
  total_billable_amount: number;
}

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  position: number;
  completed_at: string | null;
  estimated_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface KanbanColumn {
  status: TaskStatus;
  tasks: Task[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

export interface TimeEntry {
  id: string;
  project_id: string;
  task_id: string | null;
  user_id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  is_billable: boolean;
  is_invoiced: boolean;
  created_at: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  position: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  paid_at: string | null;
  line_items: InvoiceLineItem[];
  created_at: string;
}

export interface InvoiceSummary {
  id: string;
  invoice_number: string;
  client_id: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  total: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectHealth {
  id: string;
  name: string;
  color: string;
  status: string;
  task_count: number;
  completed_task_count: number;
  percent_complete: number;
  due_date: string | null;
}

export interface UpcomingTask {
  id: string;
  title: string;
  project_id: string;
  project_name: string;
  due_date: string | null;
  priority: string;
}

export interface MonthlyRevenuePoint {
  month: string;
  invoiced: number;
  collected: number;
}

export interface DashboardSummary {
  active_project_count: number;
  total_client_count: number;
  total_task_count: number;
  overdue_task_count: number;
  completed_tasks_last_7_days: number;
  hours_logged_last_7_days: number;
  outstanding_invoice_total: number;
  paid_invoice_total_this_month: number;
  project_health: ProjectHealth[];
  upcoming_tasks: UpcomingTask[];
  revenue_by_month: MonthlyRevenuePoint[];
}

export interface SearchResultItem {
  id: string;
  type: "client" | "project" | "task";
  title: string;
  subtitle: string | null;
  url: string;
}

export interface Webhook {
  id: string;
  target_url: string;
  events: string[];
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WebhookCreated extends Webhook {
  secret: string;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  response_status: number | null;
  success: boolean;
  attempted_at: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKeyItem {
  plaintext_key: string;
}

export interface Attachment {
  id: string;
  task_id: string | null;
  project_id: string | null;
  uploaded_by_id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
