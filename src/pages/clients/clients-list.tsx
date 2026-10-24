import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Users } from "lucide-react";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  company: z.string().optional(),
  email: z.string().email("Invalid email.").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ClientsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useClients({ search: search || undefined });
  const createClient = useCreateClient();
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormValues) {
    createClient.mutate(
      { ...values, email: values.email || undefined },
      { onSuccess: () => { setDialogOpen(false); reset(); } }
    );
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Everyone you do work for."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="mt-1 text-xs text-clay-400">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" {...register("company")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} />
                    {errors.email && <p className="mt-1 text-xs text-clay-400">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register("phone")} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" rows={3} {...register("notes")} />
                </div>
                <DialogFooter>
                  <Button type="submit" loading={createClient.isPending}>
                    Create client
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-500" />
          <Input placeholder="Search clients..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading && <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />}

      {!isLoading && data?.items.length === 0 && (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add the people and companies you do work for to start tracking projects and invoices against them."
        />
      )}

      {!isLoading && data && data.items.length > 0 && (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line-700 bg-ink-900 text-left text-xs uppercase tracking-wide text-paper-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/app/clients/${client.id}`)}
                  className="cursor-pointer border-b border-line-700 last:border-0 hover:bg-ink-900"
                >
                  <td className="px-4 py-3 font-medium text-paper-100">{client.name}</td>
                  <td className="px-4 py-3 text-paper-400">{client.company || "-"}</td>
                  <td className="px-4 py-3 text-paper-400">{client.email || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
