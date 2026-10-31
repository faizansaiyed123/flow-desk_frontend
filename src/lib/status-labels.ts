import type {
  InvoiceStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/types/api";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const TASK_PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "#78808f",
  medium: "#5b87c9",
  high: "#d9ac5c",
  urgent: "#c1594f",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export const INVOICE_STATUS_VARIANT: Record<
  InvoiceStatus,
  "neutral" | "sky" | "moss" | "clay"
> = {
  draft: "neutral",
  sent: "sky",
  paid: "moss",
  overdue: "clay",
  void: "neutral",
};
