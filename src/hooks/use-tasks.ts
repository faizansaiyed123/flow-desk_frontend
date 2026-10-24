import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { KanbanBoard, Task, TaskComment } from "@/types/api";
import { toast } from "@/stores/toast-store";

export function useKanbanBoard(projectId: string | undefined) {
  return useQuery({
    queryKey: ["kanban", projectId],
    queryFn: () => api.get<KanbanBoard>(`/tasks/board/${projectId}`),
    enabled: Boolean(projectId),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => api.get<Task>(`/tasks/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task> & { project_id: string; title: string }) => api.post<Task>("/tasks", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kanban", projectId] });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      toast({ title: "Task created", variant: "success" });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => api.patch<Task>(`/tasks/${id}`, data),
    onSuccess: (task) => {
      // The open task dialog reads ["tasks", taskId]. Update it from the actual
      // API response so edits (status, title, assignee, etc.) are reflected
      // immediately, not only after navigating away and back.
      qc.setQueryData(["tasks", task.id], task);
      qc.invalidateQueries({ queryKey: ["kanban", projectId] });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMoveTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: string; position: number }) =>
      api.patch<Task>(`/tasks/${id}/move`, { status, position }),
    // Optimistic update so drag-and-drop feels instant.
    onMutate: async ({ id, status, position }) => {
      await qc.cancelQueries({ queryKey: ["kanban", projectId] });
      const previous = qc.getQueryData<KanbanBoard>(["kanban", projectId]);
      if (previous) {
        const next: KanbanBoard = {
          columns: previous.columns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== id),
          })),
        };
        const moved = previous.columns.flatMap((c) => c.tasks).find((t) => t.id === id);
        if (moved) {
          const target = next.columns.find((c) => c.status === status);
          if (target) {
            target.tasks = [...target.tasks, { ...moved, status: status as Task["status"], position }].sort(
              (a, b) => a.position - b.position
            );
          }
        }
        qc.setQueryData(["kanban", projectId], next);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["kanban", projectId], context.previous);
      toast({ title: "Couldn't move task", variant: "error" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["kanban", projectId] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kanban", projectId] });
      toast({ title: "Task deleted", variant: "success" });
    },
  });
}

export function useTaskComments(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => api.get<TaskComment[]>(`/tasks/${taskId}/comments`),
    enabled: Boolean(taskId),
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<TaskComment>(`/tasks/${taskId}/comments`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-comments", taskId] }),
  });
}
