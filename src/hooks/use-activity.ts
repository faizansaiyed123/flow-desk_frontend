import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ActivityLogEntry } from "@/types/api";

export function useActivity(
  params: { entity_type?: string; entity_id?: string; limit?: number } = {},
) {
  return useQuery({
    queryKey: ["activity", params],
    queryFn: () => api.get<ActivityLogEntry[]>("/activity", params),
  });
}
