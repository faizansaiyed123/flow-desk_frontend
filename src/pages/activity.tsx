import { Activity, Clock3 } from "lucide-react";
import { useActivity } from "@/hooks/use-activity";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";

export function ActivityPage() {
  const { data, isLoading, isError } = useActivity({ limit: 50 });

  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle="A workspace-scoped timeline of recent changes."
      />
      {isLoading && (
        <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />
      )}
      {isError && (
        <p role="alert" className="text-sm text-clay-400">
          Activity could not be loaded. Please try again.
        </p>
      )}
      {!isLoading && !isError && data?.length === 0 && (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Changes to clients, projects, tasks, and invoices will appear here."
        />
      )}
      {!isLoading && !isError && Boolean(data?.length) && (
        <div className="space-y-2">
          {data?.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex items-start gap-3 py-4">
                <div className="mt-0.5 rounded-[var(--radius-card)] bg-ink-800 p-2 text-brass-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm text-paper-100">
                    <span className="capitalize">
                      {entry.action.replace(/[._]/g, " ")}
                    </span>
                    {" · "}
                    {entry.entity_label ?? entry.entity_type}
                  </p>
                  <p className="mt-1 text-xs text-paper-500">
                    {entry.entity_type} · {formatRelativeTime(entry.created_at)}
                  </p>
                </div>
                <Clock3 className="h-4 w-4 shrink-0 text-paper-500" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
