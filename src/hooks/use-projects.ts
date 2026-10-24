import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Page, Project, ProjectWithStats } from "@/types/api";
import { toast } from "@/stores/toast-store";

export function useProjects(params: { search?: string; status?: string; client_id?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => api.get<Page<ProjectWithStats>>("/projects", { ...params, page_size: 50 }),
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => api.get<ProjectWithStats>(`/projects/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) => api.post<Project>("/projects", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project created", variant: "success" });
    },
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) => api.patch<Project>(`/projects/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project updated", variant: "success" });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project deleted", variant: "success" });
    },
  });
}
