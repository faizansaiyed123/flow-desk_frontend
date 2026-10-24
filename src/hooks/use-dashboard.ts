import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { DashboardSummary } from "@/types/api";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.get<DashboardSummary>("/dashboard/summary"),
  });
}
