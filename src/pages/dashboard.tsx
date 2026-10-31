import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock, FolderKanban } from "lucide-react";

export function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data) {
    return (
      <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-paper-100">Overview</h1>
        <p className="mt-1 text-sm text-paper-500">
          Where things stand across your workspace.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Active projects"
          value={String(data.active_project_count)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue tasks"
          value={String(data.overdue_task_count)}
          tone={data.overdue_task_count > 0 ? "clay" : undefined}
        />
        <StatCard
          icon={Clock}
          label="Hours this week"
          value={data.hours_logged_last_7_days.toFixed(1)}
        />
        <StatCard
          icon={CheckCircle2}
          label="Outstanding"
          value={formatCurrency(data.outstanding_invoice_total)}
          tone="brass"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue, last 6 months</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.revenue_by_month}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#262d3a"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#78808f"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#78808f"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1f2530",
                    border: "1px solid #313947",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar
                  dataKey="invoiced"
                  fill="#3d4759"
                  radius={[3, 3, 0, 0]}
                  name="Invoiced"
                />
                <Bar
                  dataKey="collected"
                  fill="#c6963e"
                  radius={[3, 3, 0, 0]}
                  name="Collected"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-2">
            {data.upcoming_tasks.length === 0 && (
              <p className="py-6 text-center text-sm text-paper-500">
                Nothing due soon.
              </p>
            )}
            {data.upcoming_tasks.map((t) => (
              <Link
                key={t.id}
                to={`/app/projects/${t.project_id}`}
                className="flex items-center justify-between rounded-[var(--radius-card)] px-2 py-2 text-sm hover:bg-ink-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-paper-100">{t.title}</p>
                  <p className="truncate text-xs text-paper-500">
                    {t.project_name}
                  </p>
                </div>
                <span className="ml-2 shrink-0 text-xs text-paper-500">
                  {formatDate(t.due_date)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {data.project_health.length === 0 && (
            <p className="py-6 text-center text-sm text-paper-500">
              No active projects yet.
            </p>
          )}
          {data.project_health.map((p) => (
            <Link key={p.id} to={`/app/projects/${p.id}`} className="block">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-paper-100">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                </span>
                <span className="tabular text-paper-500">
                  {p.completed_task_count}/{p.task_count} tasks
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full bg-brass-500 transition-all"
                  style={{ width: `${p.percent_complete}%` }}
                />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "brass" | "clay";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            tone === "brass" && "bg-brass-950 text-brass-400",
            tone === "clay" && "bg-clay-950 text-clay-400",
            !tone && "bg-ink-800 text-paper-400",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="tabular font-display text-xl text-paper-100">{value}</p>
          <p className="text-xs text-paper-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
