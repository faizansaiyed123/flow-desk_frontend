import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Webhook, WebhookCreated, WebhookDelivery } from "@/types/api";
import { toast } from "@/stores/toast-store";

export function useWebhooks() {
  return useQuery({ queryKey: ["webhooks"], queryFn: () => api.get<Webhook[]>("/webhooks") });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { target_url: string; events: string[]; description?: string }) =>
      api.post<WebhookCreated>("/webhooks", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
    onError: (e: Error) => toast({ title: "Couldn't create webhook", description: e.message, variant: "error" }),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Webhook> }) => api.patch<Webhook>(`/webhooks/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      toast({ title: "Webhook updated", variant: "success" });
    },
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/webhooks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      toast({ title: "Webhook deleted", variant: "success" });
    },
  });
}

export function useWebhookDeliveries(webhookId: string | undefined) {
  return useQuery({
    queryKey: ["webhook-deliveries", webhookId],
    queryFn: () => api.get<WebhookDelivery[]>(`/webhooks/${webhookId}/deliveries`),
    enabled: Boolean(webhookId),
  });
}
