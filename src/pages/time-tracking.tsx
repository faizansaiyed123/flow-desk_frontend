import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Play, Square, Plus, Clock, Trash2, Pencil } from "lucide-react";
import {
  useRunningTimer,
  useStartTimer,
  useStopTimer,
  useTimeEntries,
  useCreateTimeEntry,
  useDeleteTimeEntry,
  useUpdateTimeEntry,
} from "@/hooks/use-time-entries";
import { useProjects } from "@/hooks/use-projects";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateTime, formatMinutes } from "@/lib/format";
import type { TimeEntry } from "@/types/api";

function useElapsed(startedAt?: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const update = () =>
      setElapsed(
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
      );
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type EditTimeEntryValues = {
  description: string;
  started_at: string;
  duration_minutes: number;
  is_billable: boolean;
};

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TimeTrackingPage() {
  const { data: running } = useRunningTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const { data: projects } = useProjects();
  const { data: entries } = useTimeEntries();
  const deleteEntry = useDeleteTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [timerProjectId, setTimerProjectId] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const elapsed = useElapsed(running?.started_at);

  const createEntry = useCreateTimeEntry();
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      project_id: "",
      started_at: "",
      duration_minutes: 60,
      description: "",
    },
  });

  const editForm = useForm<EditTimeEntryValues>({
    defaultValues: {
      description: "",
      started_at: "",
      duration_minutes: 60,
      is_billable: true,
    },
    values: editingEntry
      ? {
          description: editingEntry.description ?? "",
          started_at: toLocalDateTime(editingEntry.started_at),
          duration_minutes: editingEntry.duration_minutes ?? 60,
          is_billable: editingEntry.is_billable,
        }
      : undefined,
  });

  return (
    <div>
      <PageHeader
        title="Time"
        subtitle="Track hours as you work, or log them after the fact."
        actions={
          <Dialog open={manualOpen} onOpenChange={setManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4" /> Log time manually
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log time</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((v) =>
                  createEntry.mutate(
                    {
                      ...v,
                      started_at: new Date(v.started_at).toISOString(),
                      duration_minutes: Number(v.duration_minutes),
                    },
                    {
                      onSuccess: () => {
                        setManualOpen(false);
                        reset();
                      },
                    },
                  ),
                )}
                className="space-y-4"
                noValidate
              >
                <div>
                  <Label>Project</Label>
                  <Controller
                    control={control}
                    name="project_id"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects?.items.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="started_at">Date &amp; time</Label>
                    <Input
                      id="started_at"
                      type="datetime-local"
                      {...register("started_at", { required: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration_minutes">Minutes</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      {...register("duration_minutes", { required: true })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" {...register("description")} />
                </div>
                <DialogFooter>
                  <Button type="submit" loading={createEntry.isPending}>
                    Log time
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 py-5">
          {running ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brass-950 text-brass-400">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="tabular font-display text-2xl text-paper-100">
                  {elapsed}
                </p>
                <p className="text-xs text-paper-500">
                  {running.description || "Timer running..."}
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => stopTimer.mutate()}
                loading={stopTimer.isPending}
              >
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-800 text-paper-400">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Select
                  value={timerProjectId}
                  onValueChange={setTimerProjectId}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Select a project to start timing" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.items.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={!timerProjectId}
                loading={startTimer.isPending}
                onClick={() =>
                  startTimer.mutate({ project_id: timerProjectId })
                }
              >
                <Play className="h-3.5 w-3.5" /> Start timer
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingEntry)}
        onOpenChange={(open) => {
          if (!open) setEditingEntry(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit time entry</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((values) => {
              if (!editingEntry) return;
              const startedAt = new Date(values.started_at);
              const endedAt = new Date(
                startedAt.getTime() + Number(values.duration_minutes) * 60_000,
              );
              updateEntry.mutate(
                {
                  id: editingEntry.id,
                  data: {
                    description: values.description || null,
                    started_at: startedAt.toISOString(),
                    ended_at: endedAt.toISOString(),
                    duration_minutes: Number(values.duration_minutes),
                    is_billable: values.is_billable,
                  },
                },
                { onSuccess: () => setEditingEntry(null) },
              );
            })}
            className="space-y-4"
            noValidate
          >
            <div>
              <Label htmlFor="edit-time-description">Description</Label>
              <Input
                id="edit-time-description"
                {...editForm.register("description")}
              />
            </div>
            <div>
              <Label htmlFor="edit-time-started-at">Date &amp; time</Label>
              <Input
                id="edit-time-started-at"
                type="datetime-local"
                {...editForm.register("started_at", { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="edit-time-duration">Minutes</Label>
              <Input
                id="edit-time-duration"
                type="number"
                min="1"
                step="1"
                {...editForm.register("duration_minutes", {
                  valueAsNumber: true,
                  min: 1,
                  required: true,
                })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-paper-300">
              <input type="checkbox" {...editForm.register("is_billable")} />
              Billable time
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingEntry(null)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={updateEntry.isPending}>
                Save time entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {entries?.items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No time logged yet"
          description="Start a timer above or log time manually to begin tracking your billable hours."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line-700 bg-ink-900 text-left text-xs uppercase tracking-wide text-paper-500">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Duration</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries?.items.map((entry) => (
                <tr
                  key={entry.id}
                  data-time-entry-id={entry.id}
                  className="border-b border-line-700 last:border-0"
                >
                  <td className="px-4 py-3 text-paper-400">
                    {formatDateTime(entry.started_at)}
                  </td>
                  <td className="px-4 py-3 text-paper-100">
                    {entry.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-right tabular text-paper-400">
                    {formatMinutes(entry.duration_minutes)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.is_invoiced ? (
                      <Badge variant="moss">Invoiced</Badge>
                    ) : entry.is_billable ? (
                      <Badge variant="brass">Billable</Badge>
                    ) : (
                      <Badge variant="neutral">Non-billable</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!entry.is_invoiced && entry.ended_at && (
                      <div className="inline-flex items-center gap-2">
                        <button
                          aria-label={
                            "Edit time entry " +
                            (entry.description ||
                              formatDateTime(entry.started_at))
                          }
                          onClick={() => setEditingEntry(entry)}
                          className="text-paper-500 hover:text-brass-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label={
                            "Delete time entry " +
                            (entry.description ||
                              formatDateTime(entry.started_at))
                          }
                          onClick={() => deleteEntry.mutate(entry.id)}
                          className="text-paper-500 hover:text-clay-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
