import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Archive, Pencil, Trash2 } from "lucide-react";
import { useClient, useUpdateClient, useDeleteClient, useArchiveClient } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatCurrency } from "@/lib/format";

export function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(clientId);
  const { data: projects } = useProjects({ client_id: clientId });
  const updateClient = useUpdateClient(clientId!);
  const deleteClient = useDeleteClient();
  const archiveClient = useArchiveClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { register, handleSubmit } = useForm({
    values: client ? { name: client.name, company: client.company ?? "", email: client.email ?? "", phone: client.phone ?? "", notes: client.notes ?? "" } : undefined,
  });

  if (isLoading || !client) {
    return <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />;
  }

  return (
    <div>
      <Link to="/app/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-paper-500 hover:text-paper-100">
        <ArrowLeft className="h-3.5 w-3.5" /> Clients
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-paper-100">{client.name}</h1>
          {client.company && <p className="mt-1 text-sm text-paper-500">{client.company}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => archiveClient.mutate(client.id)}>
            <Archive className="h-3.5 w-3.5" /> {client.is_archived ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-paper-500">Active projects</p>
            <p className="mt-1 font-display text-xl text-paper-100">{client.active_project_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-paper-500">Total projects</p>
            <p className="mt-1 font-display text-xl text-paper-100">{client.project_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-paper-500">Total invoiced</p>
            <p className="mt-1 tabular font-display text-xl text-paper-100">{formatCurrency(client.total_invoiced)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-paper-500">Outstanding</p>
            <p className="mt-1 tabular font-display text-xl text-brass-400">{formatCurrency(client.total_outstanding)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {!projects?.items.length && <p className="py-4 text-center text-sm text-paper-500">No projects yet.</p>}
            {projects?.items.map((p) => (
              <Link
                key={p.id}
                to={`/app/projects/${p.id}`}
                className="flex items-center justify-between rounded-[var(--radius-card)] px-2 py-2 hover:bg-ink-800"
              >
                <span className="flex items-center gap-2 text-sm text-paper-100">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </span>
                <Badge variant="neutral" className="capitalize">{p.status.replace("_", " ")}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-sm">
            <div>
              <p className="text-xs text-paper-500">Email</p>
              <p className="text-paper-200">{client.email || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-paper-500">Phone</p>
              <p className="text-paper-200">{client.phone || "Not set"}</p>
            </div>
            {client.notes && (
              <div>
                <p className="text-xs text-paper-500">Notes</p>
                <p className="whitespace-pre-wrap text-paper-200">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((v) => updateClient.mutate(v, { onSuccess: () => setEditOpen(false) }))}
            className="space-y-4"
            noValidate
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" {...register("company")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
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
              <Button type="submit" loading={updateClient.isPending}>Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this client?"
        description="This can't be undone. Projects linked to this client will keep their history but lose the client reference."
        confirmLabel="Delete client"
        loading={deleteClient.isPending}
        onConfirm={() =>
          deleteClient.mutate(client.id, { onSuccess: () => navigate("/app/clients") })
        }
      />
    </div>
  );
}
