import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Invoice, InvoiceSummary, Page } from "@/types/api";
import { toast } from "@/stores/toast-store";

export function useInvoices(params: { status?: string; client_id?: string } = {}) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => api.get<Page<InvoiceSummary>>("/invoices", { ...params, page_size: 50 }),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => api.get<Invoice>(`/invoices/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateManualInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post<Invoice>("/invoices", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice created", variant: "success" });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: {
        issue_date?: string;
        due_date?: string;
        tax_rate?: number;
        notes?: string | null;
        line_items?: Array<{ description: string; quantity: number; unit_price: number }>;
      };
    }) => api.patch<Invoice>(`/invoices/${id}`, data),
    onSuccess: (invoice) => {
      qc.setQueryData(["invoices", invoice.id], invoice);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Draft invoice updated", variant: "success" });
    },
    onError: (error: Error) =>
      toast({ title: "Couldn't update invoice", description: error.message, variant: "error" }),
  });
}

export function useGenerateInvoiceFromTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { project_id: string; issue_date: string; due_date: string; tax_rate?: number; notes?: string }) =>
      api.post<Invoice>("/invoices/generate-from-time", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      toast({ title: "Invoice generated from time entries", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Couldn't generate invoice", description: e.message, variant: "error" }),
  });
}

function useInvoiceAction(action: "send" | "mark-paid" | "void" | "mark-overdue") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Invoice>(`/invoices/${id}/${action}`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices", id] });
      toast({ title: "Invoice updated", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Couldn't update invoice", description: e.message, variant: "error" }),
  });
}

export const useSendInvoice = () => useInvoiceAction("send");
export const useMarkInvoicePaid = () => useInvoiceAction("mark-paid");
export const useVoidInvoice = () => useInvoiceAction("void");
export const useMarkInvoiceOverdue = () => useInvoiceAction("mark-overdue");

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice deleted", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Couldn't delete invoice", description: e.message, variant: "error" }),
  });
}
