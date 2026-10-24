import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useKanbanBoard, useMoveTask, useCreateTask } from "@/hooks/use-tasks";
import type { Task, TaskStatus } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "backlog", label: "Backlog" },
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "in_review", label: "In Review" },
  { status: "done", label: "Done" },
];

const PRIORITY_VARIANT: Record<string, "neutral" | "brass" | "moss" | "clay" | "sky"> = {
  low: "neutral", medium: "sky", high: "brass", urgent: "clay",
};

export function KanbanBoard({ projectId, onOpenTask }: { projectId: string; onOpenTask: (taskId: string) => void }) {
  const { data: board, isLoading } = useKanbanBoard(projectId);
  const moveTask = useMoveTask(projectId);
  const createTask = useCreateTask(projectId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (isLoading || !board) {
    return <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />;
  }

  function findTask(id: string): Task | undefined {
    return board!.columns.flatMap((c) => c.tasks).find((t) => t.id === id);
  }

  function handleDragStart(event: DragStartEvent) {
    const task = findTask(String(event.active.id));
    if (task) setActiveTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    if (String(over.id) === String(active.id)) return;

    const draggedTask = findTask(String(active.id));
    if (!draggedTask) return;

    // `over.id` is either a column status (dropped on empty column area)
    // or another task id (dropped between/near cards).
    const overId = String(over.id);
    const overColumn = COLUMNS.find((c) => c.status === overId);
    const overTask = overColumn ? undefined : findTask(overId);
    const targetStatus = overColumn?.status ?? overTask?.status ?? draggedTask.status;

    const columnTasks = board!.columns.find((c) => c.status === targetStatus)?.tasks ?? [];
    let newPosition: number;
    if (overTask) {
      const overIndex = columnTasks.findIndex((t) => t.id === overTask.id);
      const prevTask = columnTasks[overIndex - 1];
      newPosition = prevTask ? (prevTask.position + overTask.position) / 2 : overTask.position - 1024;
    } else {
      const last = columnTasks[columnTasks.length - 1];
      newPosition = last ? last.position + 1024 : 1024;
    }

    if (targetStatus === draggedTask.status && Math.abs(newPosition - draggedTask.position) < 0.001) return;
    moveTask.mutate({ id: draggedTask.id, status: targetStatus, position: newPosition });
  }

  function submitNewTask(status: TaskStatus) {
    if (!newTitle.trim()) { setAddingTo(null); return; }
    createTask.mutate({ project_id: projectId, title: newTitle.trim(), status });
    setNewTitle("");
    setAddingTo(null);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const tasks = board.columns.find((c) => c.status === col.status)?.tasks ?? [];
          return (
            <DroppableColumn key={col.status} status={col.status} label={col.label} count={tasks.length}>
              <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <SortableTaskCard key={task.id} task={task} onOpen={() => onOpenTask(task.id)} />
                  ))}
                </div>
              </SortableContext>

              {addingTo === col.status ? (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      id={`new-task-title-${col.status}`}
                      autoFocus
                      placeholder="Task title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitNewTask(col.status);
                        if (e.key === "Escape") setAddingTo(null);
                      }}
                    />
                    <Label htmlFor={`new-task-title-${col.status}`} className="sr-only">Title</Label>
                    <Button size="sm" disabled={!newTitle.trim()} onClick={() => submitNewTask(col.status)}>
                      Create task
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTo(col.status)}
                  className="mt-2 flex w-full items-center gap-1.5 rounded-[var(--radius-card)] px-2 py-1.5 text-xs text-paper-500 hover:bg-ink-800 hover:text-paper-200"
                >
                  <Plus className="h-3.5 w-3.5" /> Add task
                </button>
              )}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
    </DndContext>
  );
}

function DroppableColumn({
  status, label, count, children,
}: { status: TaskStatus; label: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-[var(--radius-card)] border border-line-700 bg-ink-900/50 p-2 transition-colors",
        isOver && "border-brass-500/50 bg-ink-900"
      )}
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-sm font-medium text-paper-200">{label}</span>
        <span className="text-xs text-paper-500">{count}</span>
      </div>
      {children}
    </div>
  );
}

function SortableTaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
    >
      <TaskCard task={task} onOpen={onOpen} dragAttributes={attributes} dragListeners={listeners} />
    </div>
  );
}

function TaskCard({
  task,
  onOpen,
  dragAttributes,
  dragListeners,
}: {
  task: Task;
  onOpen?: () => void;
  dragAttributes?: React.HTMLAttributes<HTMLElement>;
  dragListeners?: React.HTMLAttributes<HTMLElement>;
}) {
  const overdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={task.title}
      className="flex w-full cursor-pointer flex-col items-start rounded-[var(--radius-card)] border border-line-700 bg-ink-800 p-3 text-left shadow-sm hover:border-line-600"
      {...dragAttributes}
      {...dragListeners}
    >
      <p className="text-sm text-paper-100">{task.title}</p>
      <div className="mt-2 flex items-center justify-between">
        <Badge variant={PRIORITY_VARIANT[task.priority]} className="capitalize">{task.priority}</Badge>
        {task.due_date && (
          <span className={cn("text-xs", overdue ? "text-clay-400" : "text-paper-500")}>{formatDate(task.due_date)}</span>
        )}
      </div>
    </button>
  );
}
