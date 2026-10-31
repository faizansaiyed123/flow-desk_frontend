import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { ArrowLeft, Pencil, Receipt, Trash2 } from "lucide-react";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useGenerateInvoiceFromTime } from "@/hooks/use-invoices";
import { KanbanBoard } from "@/components/kanban-board";
import { ProjectAttachments } from "@/components/project-attachments";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatCurrency, formatDateTime, formatMinutes } from "@/lib/format";

type ProjectEditFormValues = {
  name: string;
  description: string;
  client_id: string;
  billing_type: "hourly" | "fixed" | "non_billable";
  hourly_rate: string;
  fixed_budget: string;
};

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(projectId);
  const { data: clientPage } = useClients({ include_archived: true });
  const clients = clientPage?.items ?? [];
  const updateProject = useUpdateProject(projectId!);
  const deleteProject = useDeleteProject();
  const { data: timeEntries } = useTimeEntries({ project_id: projectId });
  const generateInvoice = useGenerateInvoiceFromTime();

  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { register, handleSubmit, control } = useForm<ProjectEditFormValues>({
    values: project
      ? {
          name: project.name,
          description: project.description ?? "",
          client_id: project.client_id ?? "none",
          billing_type: project.billing_type,
          hourly_rate:
            project.hourly_rate === null ? "" : String(project.hourly_rate),
          fixed_budget:
            project.fixed_budget === null ? "" : String(project.fixed_budget),
        }
      : undefined,
  });
  const editBillingType = useWatch({ control, name: "billing_type" });

  if (isLoading || !project) {
    return (
      <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />
    );
  }

  const unbilledMinutes = (timeEntries?.items ?? [])
    .filter((e) => e.is_billable && !e.is_invoiced && e.ended_at)
    .reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);

  return (
    <div>
      <Link
        to="/app/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-paper-500 hover:text-paper-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Projects
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="font-display text-2xl text-paper-100">
              {project.name}
            </h1>
            <Badge variant="neutral" className="capitalize">
              {STATUS_LABEL[project.status]}
            </Badge>
          </div>
          {project.client_name && (
            <p className="mt-1 text-sm text-paper-500">{project.client_name}</p>
          )}
          {project.billing_type === "hourly" &&
            project.client_id &&
            project.hourly_rate === null &&
            unbilledMinutes > 0 && (
              <p className="mt-1 text-xs text-clay-400">
                Set an hourly rate before invoicing this project's unbilled
                time.
              </p>
            )}
        </div>
        <div className="flex gap-2">
          {project.billing_type === "hourly" && project.client_id && (
            <Button
              variant="secondary"
              size="sm"
              disabled={unbilledMinutes === 0}
              loading={generateInvoice.isPending}
              onClick={() =>
                generateInvoice.mutate({
                  project_id: project.id,
                  issue_date: new Date().toISOString().slice(0, 10),
                  due_date: new Date(Date.now() + 30 * 86400000)
                    .toISOString()
                    .slice(0, 10),
                })
              }
            >
              <Receipt className="h-3.5 w-3.5" /> Invoice unbilled time
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            aria-label="Delete project"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-paper-500">Tasks</p>
            <p className="mt-1 font-display text-xl text-paper-100">
              {project.completed_task_count}/{project.task_count}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-paper-500">Hours logged</p>
            <p className="mt-1 font-display text-xl text-paper-100">
              {project.total_hours_logged}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-paper-500">Billable value</p>
            <p className="mt-1 tabular font-display text-xl text-paper-100">
              {formatCurrency(project.total_billable_amount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-paper-500">Unbilled time</p>
            <p className="mt-1 font-display text-xl text-brass-400">
              {formatMinutes(unbilledMinutes)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="board">
        <TabsList className="mb-4">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <KanbanBoard projectId={project.id} onOpenTask={setOpenTaskId} />
        </TabsContent>
        <TabsContent value="time">
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line-700 bg-ink-900 text-left text-xs uppercase tracking-wide text-paper-500">
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Duration</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(timeEntries?.items ?? []).map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-line-700 last:border-0"
                  >
                    <td className="px-4 py-3 text-paper-400">
                      {formatDateTime(entry.started_at)}
                    </td>
                    <td className="px-4 py-3 text-paper-100">
                      {entry.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-right tabular text-paper-400">
                      {formatMinutes(entry.duration_minutes)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.is_invoiced ? (
                        <Badge variant="moss">Invoiced</Badge>
                      ) : entry.is_billable ? (
                        <Badge variant="brass">Billable</Badge>
                      ) : (
                        <Badge variant="neutral">Non-billable</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {(timeEntries?.items ?? []).length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-paper-500"
                    >
                      No time logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="files">
          <ProjectAttachments projectId={project.id} />
        </TabsContent>
      </Tabs>

      {openTaskId && (
        <TaskDetailDialog
          taskId={openTaskId}
          projectId={project.id}
          open={Boolean(openTaskId)}
          onOpenChange={(open) => !open && setOpenTaskId(null)}
        />
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((values) =>
              updateProject.mutate(
                {
                  name: values.name,
                  description: values.description,
                  client_id:
                    values.client_id === "none" ? null : values.client_id,
                  billing_type: values.billing_type,
                  hourly_rate:
                    values.hourly_rate.trim() === ""
                      ? null
                      : Number(values.hourly_rate),
                  fixed_budget:
                    values.fixed_budget.trim() === ""
                      ? null
                      : Number(values.fixed_budget),
                },
                { onSuccess: () => setEditOpen(false) },
              ),
            )}
            className="space-y-4"
            noValidate
          >
            <div>
              <Label htmlFor="project-edit-name">Name</Label>
              <Input id="project-edit-name" {...register("name")} />
            </div>
            <div>
              <Label htmlFor="project-edit-description">Description</Label>
              <Input
                id="project-edit-description"
                {...register("description")}
              />
            </div>
            <div>
              <Label htmlFor="project-edit-client">Client</Label>
              <Controller
                control={control}
                name="client_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="project-edit-client" aria-label="Client">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="project-edit-billing-type">Billing type</Label>
              <Controller
                control={control}
                name="billing_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="project-edit-billing-type"
                      aria-label="Billing type"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="fixed">Fixed budget</SelectItem>
                      <SelectItem value="non_billable">Non-billable</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {editBillingType === "hourly" && (
              <div>
                <Label htmlFor="project-edit-hourly-rate">Hourly rate</Label>
                <Input
                  id="project-edit-hourly-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("hourly_rate")}
                />
              </div>
            )}
            {editBillingType === "fixed" && (
              <div>
                <Label htmlFor="project-edit-fixed-budget">Fixed budget</Label>
                <Input
                  id="project-edit-fixed-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("fixed_budget")}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" loading={updateProject.isPending}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this project?"
        description="This permanently deletes the project and all of its tasks. Time entries and invoices already generated are kept."
        confirmLabel="Delete project"
        loading={deleteProject.isPending}
        onConfirm={() =>
          deleteProject.mutate(project.id, {
            onSuccess: () => navigate("/app/projects"),
          })
        }
      />
    </div>
  );
}
