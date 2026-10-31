import { useRef, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import {
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from "@/hooks/use-attachments";
import { api } from "@/lib/api-client";
import { toast } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Attachment } from "@/types/api";

function formatBytes(size: number) {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
}

export function ProjectAttachments({ projectId }: { projectId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data: attachments, isLoading, isError } = useAttachments(projectId);
  const upload = useUploadAttachment(projectId);
  const remove = useDeleteAttachment(projectId);

  async function downloadAttachment(attachment: Attachment) {
    setDownloadingId(attachment.id);
    try {
      const blob = await api.get<Blob>(
        "/attachments/" + attachment.id + "/download",
      );
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = attachment.file_name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      toast({
        title: "Download started",
        description: attachment.file_name,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Couldn't download file",
        description:
          error instanceof Error ? error.message : "Unexpected download error.",
        variant: "error",
      });
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Project files</CardTitle>
          <p className="mt-1 text-xs text-paper-500">
            Upload, download, and remove files attached to this project.
          </p>
        </div>
        <div>
          <input
            ref={fileInput}
            type="file"
            aria-label="Upload project attachment"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.docx,.xlsx,.csv,.txt,.zip"
            className="sr-only"
            onChange={(event) => {
              const selected = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (selected) upload.mutate(selected);
            }}
          />
          <Button
            onClick={() => fileInput.current?.click()}
            loading={upload.isPending}
          >
            <Upload className="h-4 w-4" /> Upload file
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        {isLoading && (
          <div className="h-20 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />
        )}
        {isError && (
          <p role="alert" className="text-sm text-clay-400">
            Files could not be loaded. Please try again.
          </p>
        )}
        {!isLoading && !isError && (attachments?.length ?? 0) === 0 && (
          <p className="py-8 text-center text-sm text-paper-500">
            No files attached yet.
          </p>
        )}
        {attachments?.map((attachment) => (
          <div
            key={attachment.id}
            data-attachment-id={attachment.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line-700 px-3 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-ink-800 text-brass-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="break-all text-sm text-paper-100">
                  {attachment.file_name}
                </p>
                <p className="mt-0.5 text-xs text-paper-500">
                  {formatBytes(attachment.size_bytes)} ·{" "}
                  {attachment.content_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">Project file</Badge>
              <Button
                variant="outline"
                size="sm"
                aria-label={"Download " + attachment.file_name}
                loading={downloadingId === attachment.id}
                onClick={() => void downloadAttachment(attachment)}
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button
                variant="danger"
                size="sm"
                aria-label={"Delete " + attachment.file_name}
                loading={remove.isPending && remove.variables === attachment.id}
                onClick={() => remove.mutate(attachment.id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
