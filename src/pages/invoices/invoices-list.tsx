import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { useInvoices, useCreateManualInvoice } from "@/hooks/use-invoices";
import { useClients } from "@/hooks/use-clients";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceStatus } from "@/types/api";

const STATUS_VARIANT: Record<InvoiceStatus, "neutral" | "brass" | "moss" | "clay" | "sky"> = {
  draft: "neutral", sent: "sky", paid: "moss", overdue: "clay", void: "neutral",
};

export function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useInvoices({ status: statusFilter || undefined });
  const { data: clients } = useClients({});
  const createInvoice = useCreateManualInvoice();
  const navigate = useNavigate();

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      client_id: "", issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      tax_rate: 0, line_items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "line_items" });

  function onSubmit(values: Record<string, unknown>) {
    createInvoice.mutate(values, {
      onSuccess: (invoice) => {
        setDialogOpen(false);
        reset();
        navigate(`/app/invoices/${invoice.id}`);
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Bill your clients and track what's owed."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New invoice</DialogTitle></DialogHeader>
<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="client_id">Client</Label>
                  <Controller
                    control={control}
                    name="client_id"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="client_id"><SelectValue placeholder="Select a client" /></SelectTrigger>
                        <SelectContent>
                          {clients?.items.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="issue_date">Issue date</Label>
                    <Input id="issue_date" type="date" {...register("issue_date")} />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due date</Label>
                    <Input id="due_date" type="date" {...register("due_date")} />
                  </div>
                  <div>
                    <Label htmlFor="tax_rate">Tax %</Label>
                    <Input id="tax_rate" type="number" step="0.01" {...register("tax_rate")} />
                  </div>
                </div>

                <div>
                  <Label>Line items</Label>
                  <div className="space-y-2">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`line_items_${idx}_description`} className="sr-only">Description</Label>
                          <Input id={`line_items_${idx}_description`} placeholder="Description" className="flex-1" {...register(`line_items.${idx}.description` as const, { required: true })} />
                        </div>
                        <div className="w-20">
                          <Label htmlFor={`line_items_${idx}_quantity`} className="sr-only">Quantity</Label>
                          <Input id={`line_items_${idx}_quantity`} type="number" step="0.01" placeholder="Qty" className="w-20" {...register(`line_items.${idx}.quantity` as const, { required: true })} />
                        </div>
                        <div className="w-24">
                          <Label htmlFor={`line_items_${idx}_unit_price`} className="sr-only">Unit price</Label>
                          <Input id={`line_items_${idx}_unit_price`} type="number" step="0.01" placeholder="Price" className="w-24" {...register(`line_items.${idx}.unit_price` as const, { required: true })} />
                        </div>
                        <button type="button" onClick={() => remove(idx)} className="text-paper-500 hover:text-clay-400 self-center">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}>
                    <Plus className="h-3.5 w-3.5" /> Add line item
                  </Button>
                </div>

                <DialogFooter>
                  <Button type="submit" loading={createInvoice.isPending}>Create invoice</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 flex gap-2">
        {["", "draft", "sent", "paid", "overdue", "void"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === s ? "bg-brass-500 text-ink-950" : "bg-ink-800 text-paper-400 hover:text-paper-100"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {isLoading && <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />}

      {!isLoading && data?.items.length === 0 && (
        <EmptyState icon={Receipt} title="No invoices yet" description="Create your first invoice manually, or generate one from unbilled time on a project." />
      )}

      {!isLoading && data && data.items.length > 0 && (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line-700 bg-ink-900 text-left text-xs uppercase tracking-wide text-paper-500">
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((invoice) => (
                <tr key={invoice.id} onClick={() => navigate(`/app/invoices/${invoice.id}`)} className="cursor-pointer border-b border-line-700 last:border-0 hover:bg-ink-900">
                  <td className="px-4 py-3 font-medium text-paper-100">{invoice.invoice_number}</td>
                  <td className="px-4 py-3 text-paper-400">{formatDate(invoice.issue_date)}</td>
                  <td className="px-4 py-3 text-paper-400">{formatDate(invoice.due_date)}</td>
                  <td className="px-4 py-3 text-right tabular text-paper-100">{formatCurrency(invoice.total)}</td>
                  <td className="px-4 py-3 text-right"><Badge variant={STATUS_VARIANT[invoice.status]} className="capitalize">{invoice.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
