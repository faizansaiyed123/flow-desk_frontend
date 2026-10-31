import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Attachment } from "@/types/api";
import { toast } from "@/stores/toast-store";

export function useAttachments(projectId: string | undefined) {
  return useQuery({
    queryKey: ["attachments", projectId],
    queryFn: () =>
      api.get<Attachment[]>("/attachments", { project_id: projectId }),
    enabled: Boolean(projectId),
  });
}

export function useUploadAttachment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file, file.name);
      return api.post<Attachment>("/attachments", form, {
        isFormData: true,
        params: { project_id: projectId },
      });
    },
    onSuccess: (attachment) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      toast({
        title: "File uploaded",
        description: attachment.file_name,
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't upload file",
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useDeleteAttachment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      api.delete("/attachments/" + attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      toast({ title: "Attachment deleted", variant: "success" });
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't delete attachment",
        description: error.message,
        variant: "error",
      });
    },
  });
}
