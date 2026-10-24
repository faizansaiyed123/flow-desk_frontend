import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Ban, CheckCircle2, Pencil, Send, Trash2 } from "lucide-react";
import { useInvoice, useSendInvoice, useMarkInvoicePaid, useVoidInvoice, useDeleteInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { useClient } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceStatus } from "@/types/api";

const STATUS_VARIANT: Record<InvoiceStatus, "neutral" | "brass" | "moss" | "clay" | "sky"> = {
  draft: "neutral", sent: "sky", paid: "moss", overdue: "clay", void: "neutral",
};

type InvoiceEditFormValues = {
  issue_date: string;
  due_date: string;
  tax_rate: number;
  notes: string;
  line_items: Array<{ description: string; quantity: number; unit_price: number }>;
};

export function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: client } = useClient(invoice?.client_id);
  const sendInvoice = useSendInvoice();
  const markPaid = useMarkInvoicePaid();
  const voidInvoice = useVoidInvoice();
  const deleteInvoice = useDeleteInvoice();
  const updateInvoice = useUpdateInvoice();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const editForm = useForm<InvoiceEditFormValues>({
    defaultValues: {
      issue_date: "",
      due_date: "",
      tax_rate: 0,
      notes: "",
      line_items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
    values: invoice
      ? {
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          tax_rate: invoice.tax_rate,
          notes: invoice.notes ?? "",
          line_items: invoice.line_items.map(({ description, quantity, unit_price }) => ({
            description,
            quantity,
            unit_price,
          })),
        }
      : undefined,
  });
  const lineItems = useFieldArray({ control: editForm.control, name: "line_items" });

  if (isLoading || !invoice) {
    return <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />;
  }

  return (
    <div>
      <Link to="/app/invoices" className="mb-4 inline-flex items-center gap-1.5 text-sm text-paper-500 hover:text-paper-100">
        <ArrowLeft className="h-3.5 w-3.5" /> Invoices
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl text-paper-100">{invoice.invoice_number}</h1>
            <Badge variant={STATUS_VARIANT[invoice.status]} className="capitalize" aria-label={`Invoice status: ${invoice.status}`}>{invoice.status}</Badge>
          </div>
          {client && <p className="mt-1 text-sm text-paper-500">{client.name}</p>}
        </div>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
          {invoice.status === "draft" && (
            <Button size="sm" onClick={() => sendInvoice.mutate(invoice.id)} loading={sendInvoice.isPending}>
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <Button size="sm" variant="secondary" onClick={() => markPaid.mutate(invoice.id)} loading={markPaid.isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark paid
            </Button>
          )}
          {invoice.status !== "paid" && invoice.status !== "void" && (
            <Button size="sm" variant="outline" onClick={() => voidInvoice.mutate(invoice.id)} loading={voidInvoice.isPending}>
              <Ban className="h-3.5 w-3.5" /> Void
            </Button>
          )}
          {invoice.status === "draft" && (
            <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card><CardContent className="py-4"><p className="text-xs text-paper-500">Issue date</p><p className="mt-1 text-paper-100">{formatDate(invoice.issue_date)}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-paper-500">Due date</p><p className="mt-1 text-paper-100">{formatDate(invoice.due_date)}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-paper-500">Paid on</p><p className="mt-1 text-paper-100">{formatDate(invoice.paid_at)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line-700 text-left text-xs uppercase tracking-wide text-paper-500">
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 text-right font-medium">Qty</th>
                <th className="px-5 py-3 text-right font-medium">Unit price</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item) => (
                <tr key={item.id} className="border-b border-line-700">
                  <td className="px-5 py-3 text-paper-100">{item.description}</td>
                  <td className="px-5 py-3 text-right tabular text-paper-400">{item.quantity}</td>
                  <td className="px-5 py-3 text-right tabular text-paper-400">{formatCurrency(item.unit_price)}</td>
                  <td className="px-5 py-3 text-right tabular text-paper-100">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-line-700 px-5 py-4">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between text-paper-400"><span>Subtotal</span><span className="tabular">{formatCurrency(invoice.subtotal)}</span></div>
              <div className="flex justify-between text-paper-400"><span>Tax ({invoice.tax_rate}%)</span><span className="tabular">{formatCurrency(invoice.tax_amount)}</span></div>
              <div className="flex justify-between border-t border-line-700 pt-1 font-display text-base text-paper-100"><span>Total</span><span className="tabular">{formatCurrency(invoice.total)}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card className="mt-4">
          <CardContent className="py-4 text-sm text-paper-300">{invoice.notes}</CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit draft invoice</DialogTitle></DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((values) =>
              updateInvoice.mutate(
                { id: invoice.id, data: values },
                { onSuccess: () => setEditOpen(false) },
              )
            )}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="invoice-edit-issue-date">Issue date</Label>
                <Input id="invoice-edit-issue-date" type="date" {...editForm.register("issue_date", { required: true })} />
              </div>
              <div>
                <Label htmlFor="invoice-edit-due-date">Due date</Label>
                <Input id="invoice-edit-due-date" type="date" {...editForm.register("due_date", { required: true })} />
              </div>
            </div>
            <div>
              <Label htmlFor="invoice-edit-tax-rate">Tax rate (%)</Label>
              <Input id="invoice-edit-tax-rate" type="number" min="0" max="100" step="0.01" {...editForm.register("tax_rate", { valueAsNumber: true, min: 0, max: 100 })} />
            </div>
            <div>
              <Label htmlFor="invoice-edit-notes">Notes</Label>
              <Textarea id="invoice-edit-notes" rows={2} {...editForm.register("notes")} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => lineItems.append({ description: "", quantity: 1, unit_price: 0 })}
                >
                  Add line item
                </Button>
              </div>
              {lineItems.fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[minmax(0,2fr)_minmax(70px,1fr)_minmax(90px,1fr)_auto] items-end gap-2">
                  <div>
                    <Label htmlFor={"invoice-line-description-" + index}>Description</Label>
                    <Input id={"invoice-line-description-" + index} {...editForm.register(`line_items.${index}.description` as const, { required: true })} />
                  </div>
                  <div>
                    <Label htmlFor={"invoice-line-quantity-" + index}>Qty</Label>
                    <Input id={"invoice-line-quantity-" + index} type="number" min="0.01" step="0.01" {...editForm.register(`line_items.${index}.quantity` as const, { valueAsNumber: true, min: 0.01, required: true })} />
                  </div>
                  <div>
                    <Label htmlFor={"invoice-line-price-" + index}>Unit price</Label>
                    <Input id={"invoice-line-price-" + index} type="number" min="0" step="0.01" {...editForm.register(`line_items.${index}.unit_price` as const, { valueAsNumber: true, min: 0, required: true })} />
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={lineItems.fields.length === 1}
                    aria-label={"Remove line item " + (index + 1)}
                    onClick={() => lineItems.remove(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" loading={updateInvoice.isPending}>Save draft changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this invoice?"
        description="This permanently deletes the draft invoice. Any time entries it claimed will become available to invoice again."
        confirmLabel="Delete invoice"
        loading={deleteInvoice.isPending}
        onConfirm={() => deleteInvoice.mutate(invoice.id, { onSuccess: () => navigate("/app/invoices") })}
      />
    </div>
  );
}
