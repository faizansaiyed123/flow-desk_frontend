import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTask, useUpdateTask, useDeleteTask, useTaskComments, useAddComment } from "@/hooks/use-tasks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/format";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function TaskDetailDialog({
  taskId, projectId, open, onOpenChange,
}: { taskId: string; projectId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: task } = useTask(taskId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const { data: comments } = useTaskComments(taskId);
  const addComment = useAddComment(taskId);
  const [commentBody, setCommentBody] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState("");

  if (!task) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Edit task</DialogTitle>
            <Input
              defaultValue={task.title}
              key={task.id}
              aria-label={task.title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title && title !== task.title && updateTask.mutate({ id: task.id, data: { title } })}
              className="border-none bg-transparent p-0 font-display text-xl focus-visible:ring-0"
            />
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-status">Status</Label>
              <Select value={task.status} onValueChange={(v) => updateTask.mutate({ id: task.id, data: { status: v as never } })}>
                <SelectTrigger id="task-status" aria-label="Status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={task.priority} onValueChange={(v) => updateTask.mutate({ id: task.id, data: { priority: v as never } })}>
                <SelectTrigger id="task-priority" aria-label="Priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due date</Label>
              <Input
                type="date"
                defaultValue={task.due_date ?? ""}
                onBlur={(e) => updateTask.mutate({ id: task.id, data: { due_date: e.target.value || null } as never })}
              />
            </div>
            <div>
              <Label>Estimated hours</Label>
              <Input
                type="number"
                step="0.5"
                defaultValue={task.estimated_hours ?? ""}
                onBlur={(e) => updateTask.mutate({ id: task.id, data: { estimated_hours: e.target.value ? Number(e.target.value) : null } as never })}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              defaultValue={task.description ?? ""}
              onBlur={(e) => updateTask.mutate({ id: task.id, data: { description: e.target.value } })}
            />
          </div>

          <div className="mt-2 border-t border-line-700 pt-4">
            <p className="mb-2 text-sm font-medium text-paper-300">Comments</p>
            <div className="mb-3 max-h-48 space-y-3 overflow-y-auto">
              {comments?.length === 0 && <p className="text-sm text-paper-500">No comments yet.</p>}
              {comments?.map((c) => (
                <div key={c.id} className="rounded-[var(--radius-card)] bg-ink-800 px-3 py-2 text-sm">
                  <p className="text-paper-100">{c.body}</p>
                  <p className="mt-1 text-xs text-paper-500">{formatRelativeTime(c.created_at)}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentBody.trim()) {
                    addComment.mutate(commentBody.trim());
                    setCommentBody("");
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={() => { if (commentBody.trim()) { addComment.mutate(commentBody.trim()); setCommentBody(""); } }}
              >
                Post
              </Button>
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-line-700 pt-4">
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this task?"
        description="This will permanently remove the task and its comments."
        confirmLabel="Delete task"
        loading={deleteTask.isPending}
        onConfirm={() => deleteTask.mutate(task.id, { onSuccess: () => { setDeleteOpen(false); onOpenChange(false); } })}
      />
    </>
  );
}
