import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
} from "@/hooks/use-projects";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ProjectCreateDialog } from "@/components/project-create-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { FolderKanban } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};
const STATUS_VARIANT: Record<
  string,
  "neutral" | "brass" | "moss" | "clay" | "sky"
> = {
  planning: "sky",
  active: "moss",
  on_hold: "clay",
  completed: "brass",
  archived: "neutral",
};

export function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { data, isLoading } = useProjects({
    status: statusFilter || undefined,
  });
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Organize work into projects, then break them down into tasks."
        actions={
          <ProjectCreateDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSubmit={(v) =>
              createProject.mutate(v, { onSuccess: () => setDialogOpen(false) })
            }
            loading={createProject.isPending}
          />
        }
      />

      <div className="mb-4 flex gap-2">
        {["", "planning", "active", "completed", "archived"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-brass-500 text-ink-950"
                : "bg-ink-800 text-paper-400 hover:text-paper-100"
            }`}
          >
            {s ? STATUS_LABEL[s] : "All"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />
      )}

      {!isLoading && data?.items.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to start organizing tasks, tracking time, and generating invoices."
        />
      )}

      {!isLoading && data && data.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="h-1" style={{ backgroundColor: p.color }} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/app/projects/${p.id}`}
                      className="font-display text-lg text-paper-100 hover:text-brass-400"
                    >
                      {p.name}
                    </Link>
                    {p.client_name && (
                      <p className="truncate text-xs text-paper-500">
                        {p.client_name}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={STATUS_VARIANT[p.status]}
                    className="capitalize"
                  >
                    {STATUS_LABEL[p.status]}
                  </Badge>
                </div>
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-paper-400">
                    {p.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-paper-500">
                  <span>
                    {p.completed_task_count}/{p.task_count} tasks
                  </span>
                  <span>Updated {formatDateTime(p.updated_at)}</span>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Link to={`/app/projects/${p.id}`}>Open</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-clay-400 hover:text-clay-400"
                    onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this project?"
        description="This permanently deletes the project and all of its tasks. Time entries and invoices already generated are kept."
        confirmLabel="Delete project"
        loading={deleteProject.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteProject.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
