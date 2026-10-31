import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { SearchResultItem } from "@/types/api";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () =>
      api.get<{ query: string; results: SearchResultItem[] }>("/search", {
        q: query,
      }),
    enabled: query.trim().length >= 2,
  });
}
