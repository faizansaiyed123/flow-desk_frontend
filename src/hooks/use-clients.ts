import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Client, ClientWithStats, Page } from "@/types/api";
import { toast } from "@/stores/toast-store";

export function useClients(params: { search?: string; include_archived?: boolean; page?: number }) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => api.get<Page<Client>>("/clients", { ...params, page_size: 20 }),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => api.get<ClientWithStats>(`/clients/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) => api.post<Client>("/clients", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client created", variant: "success" });
    },
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) => api.patch<Client>(`/clients/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client updated", variant: "success" });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client deleted", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Couldn't delete client", description: e.message, variant: "error" }),
  });
}

export function useArchiveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Client>(`/clients/${id}/archive`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients", id] });
      toast({ title: "Client archived", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Couldn't archive client", description: e.message, variant: "error" }),
  });
}
