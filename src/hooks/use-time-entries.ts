import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Page, TimeEntry } from "@/types/api";
import { toast } from "@/stores/toast-store";

export function useTimeEntries(params: { project_id?: string; user_id?: string; is_invoiced?: boolean } = {}) {
  return useQuery({
    queryKey: ["time-entries", params],
    queryFn: () => api.get<Page<TimeEntry>>("/time-entries", { ...params, page_size: 50 }),
  });
}

export function useRunningTimer() {
  return useQuery({
    queryKey: ["timer", "running"],
    queryFn: () => api.get<TimeEntry | null>("/time-entries/timer/running"),
    refetchInterval: 30_000,
  });
}

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { project_id: string; task_id?: string; description?: string }) =>
      api.post<TimeEntry>("/time-entries/timer/start", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timer"] });
      toast({ title: "Timer started", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Couldn't start timer", description: e.message, variant: "error" }),
  });
}

export function useStopTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<TimeEntry>("/time-entries/timer/stop"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timer"] });
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      toast({ title: "Timer stopped", variant: "success" });
    },
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TimeEntry> & { project_id: string; started_at: string }) =>
      api.post<TimeEntry>("/time-entries", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      toast({ title: "Time entry logged", variant: "success" });
    },
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/time-entries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      toast({ title: "Time entry deleted", variant: "success" });
    },
  });
}
