import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { useMe, useChangePassword, useUpdateProfile } from "@/hooks/use-auth";
import { useCurrentTenant, useUpdateTenant, useTeamMembers, useUpdateMemberRole, useRemoveMember, useInvitations, useCreateInvitation, useRevokeInvitation } from "@/hooks/use-team";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/hooks/use-api-keys";
import { useWebhooks, useCreateWebhook, useDeleteWebhook, useUpdateWebhook, useWebhookDeliveries } from "@/hooks/use-webhooks";
import { formatDate } from "@/lib/format";
import type { MembershipRole, Webhook } from "@/types/api";

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, workspace, team, and integrations." />
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="workspace"><WorkspaceTab /></TabsContent>
        <TabsContent value="team"><TeamTab /></TabsContent>
        <TabsContent value="api-keys"><ApiKeysTab /></TabsContent>
        <TabsContent value="webhooks"><WebhooksTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const { data: me } = useMe();
  const changePassword = useChangePassword();
  const updateProfile = useUpdateProfile();
  const profileForm = useForm<{ full_name: string }>({
    values: me ? { full_name: me.user.full_name } : undefined,
  });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { current_password: "", new_password: "" },
  });

  return (
    <div className="max-w-md space-y-6">
      <Card>
        <CardHeader><CardTitle>Your profile</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-2 text-sm">
          <form
            onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}
            className="space-y-3"
            noValidate
          >
            <div>
              <Label htmlFor="profile_full_name">Full name</Label>
              <Input id="profile_full_name" {...profileForm.register("full_name", { required: true, minLength: 1 })} />
              {profileForm.formState.errors.full_name && (
                <p className="mt-1 text-xs text-clay-400">Your name is required.</p>
              )}
            </div>
            <Button type="submit" loading={updateProfile.isPending}>Save profile</Button>
          </form>
          <div><p className="text-xs text-paper-500">Email</p><p className="text-paper-100">{me?.user.email}</p></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
        <CardContent className="pt-2">
          <form
            onSubmit={handleSubmit((v) => changePassword.mutate(v, { onSuccess: () => reset() }))}
            className="space-y-4"
            noValidate
          >
            <div>
              <Label htmlFor="current_password">Current password</Label>
              <Input id="current_password" type="password" {...register("current_password", { required: true })} />
            </div>
            <div>
              <Label htmlFor="new_password">New password</Label>
              <Input id="new_password" type="password" {...register("new_password", { required: true, minLength: 8 })} />
              {errors.new_password && <p className="mt-1 text-xs text-clay-400">At least 8 characters.</p>}
            </div>
            <Button type="submit" loading={changePassword.isPending}>Update password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkspaceTab() {
  const { data: tenant } = useCurrentTenant();
  const updateTenant = useUpdateTenant();
  const { register, handleSubmit } = useForm({ values: tenant ? { name: tenant.name } : undefined });

  return (
    <Card className="max-w-md">
      <CardHeader><CardTitle>Workspace</CardTitle></CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit((v) => updateTenant.mutate(v))} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" {...register("name")} />
          </div>
          <Button type="submit" loading={updateTenant.isPending}>Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TeamTab() {
  const { data: members } = useTeamMembers();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const { data: invitations } = useInvitations();
  const createInvitation = useCreateInvitation();
  const revokeInvitation = useRevokeInvitation();
  const [inviteOpen, setInviteOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { email: "", role: "member" as MembershipRole } });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team members</CardTitle>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5" /> Invite</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite a team member</DialogTitle></DialogHeader>
              <form
                onSubmit={handleSubmit((v) => createInvitation.mutate(v, { onSuccess: () => { setInviteOpen(false); reset(); } }))}
                className="space-y-4"
                noValidate
              >
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email", { required: true })} />
                </div>
                <div>
                  <Label>Role</Label>
                  <select
                    className="flex h-9 w-full rounded-[var(--radius-card)] border border-line-600 bg-ink-900 px-3 text-sm text-paper-100"
                    {...register("role")}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button type="submit" loading={createInvitation.isPending}>Send invitation</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-1 pt-2">
          {members?.map((m) => (
            <div key={m.membership_id} className="flex items-center justify-between rounded-[var(--radius-card)] px-2 py-2">
              <div>
                <p className="text-sm text-paper-100">{m.user.full_name}</p>
                <p className="text-xs text-paper-500">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={m.role}
                  onValueChange={(v) => updateRole.mutate({ membershipId: m.membership_id, role: v as MembershipRole })}
                >
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <button aria-label={`Remove ${m.user.full_name}`} onClick={() => removeMember.mutate(m.membership_id)} className="text-paper-500 hover:text-clay-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {Boolean(invitations?.length) && (
        <Card>
          <CardHeader><CardTitle>Pending invitations</CardTitle></CardHeader>
          <CardContent className="space-y-1 pt-2">
            {invitations?.filter((i) => i.status === "pending").map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-[var(--radius-card)] px-2 py-2 text-sm">
                <div>
                  <p className="text-paper-100">{inv.email}</p>
                  <p className="text-xs capitalize text-paper-500">{inv.role} - expires {formatDate(inv.expires_at)}</p>
                </div>
                <button onClick={() => revokeInvitation.mutate(inv.id)} className="text-xs text-clay-400 hover:underline">
                  Revoke
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ApiKeysTab() {
  const { data: keys } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: "" } });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>API Keys</CardTitle>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setNewKey(null); reset(); } }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5" /> New key</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{newKey ? "Copy your API key" : "New API key"}</DialogTitle></DialogHeader>
            {newKey ? (
              <div className="space-y-3">
                <p className="text-sm text-paper-400">This is the only time you'll see this key. Store it somewhere safe.</p>
                <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-line-600 bg-ink-950 px-3 py-2">
                  <code className="flex-1 overflow-x-auto text-xs text-brass-400">{newKey}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="text-paper-400 hover:text-paper-100"
                  >
                    {copied ? <Check className="h-4 w-4 text-moss-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <DialogFooter><Button onClick={() => setCreateOpen(false)}>Done</Button></DialogFooter>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit((v) =>
                  createKey.mutate(v.name, { onSuccess: (data) => setNewKey(data.plaintext_key) })
                )}
                className="space-y-4"
                noValidate
              >
                <div>
                  <Label htmlFor="name">Key name</Label>
                  <Input id="name" placeholder="CI integration" {...register("name", { required: true })} />
                </div>
                <DialogFooter><Button type="submit" loading={createKey.isPending}>Generate key</Button></DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        {!keys?.length && <p className="py-6 text-center text-sm text-paper-500">No API keys yet.</p>}
        {keys?.map((k) => (
          <div key={k.id} className="flex items-center justify-between rounded-[var(--radius-card)] px-2 py-2 text-sm">
            <div>
              <p className="text-paper-100">{k.name}</p>
              <p className="font-mono text-xs text-paper-500">{k.key_prefix}...</p>
            </div>
            <div className="flex items-center gap-2">
              {k.is_active ? <Badge variant="moss">Active</Badge> : <Badge variant="neutral">Revoked</Badge>}
              {k.is_active && (
                <button onClick={() => revokeKey.mutate(k.id)} className="text-paper-500 hover:text-clay-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const WEBHOOK_EVENTS = ["task.created", "task.updated", "task.completed", "project.created", "project.status_changed", "invoice.sent", "invoice.paid"];

function WebhooksTab() {
  const { data: webhooks } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const [createOpen, setCreateOpen] = useState(false);
  const { register, handleSubmit, reset, control, setValue } = useForm({
    defaultValues: { target_url: "", events: [] as string[] },
  });
  const selectedEvents = useWatch({ control, name: "events" });

  function toggleEvent(event: string) {
    setValue("events", selectedEvents.includes(event) ? selectedEvents.filter((e) => e !== event) : [...selectedEvents, event]);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Webhooks</CardTitle>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5" /> New webhook</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New webhook</DialogTitle></DialogHeader>
            <form
              onSubmit={handleSubmit((v) => createWebhook.mutate(v, { onSuccess: () => { setCreateOpen(false); reset(); } }))}
              className="space-y-4"
              noValidate
            >
              <div>
                <Label htmlFor="target_url">Target URL</Label>
                <Input id="target_url" placeholder="https://example.com/webhooks/flowdesk" {...register("target_url", { required: true })} />
              </div>
              <div>
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {WEBHOOK_EVENTS.map((event) => (
                    <button
                      type="button"
                      key={event}
                      onClick={() => toggleEvent(event)}
                      className={`rounded-[var(--radius-card)] border px-2 py-1.5 text-left text-xs ${
                        selectedEvents.includes(event) ? "border-brass-500/50 bg-brass-950 text-brass-300" : "border-line-600 text-paper-400"
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter><Button type="submit" loading={createWebhook.isPending} disabled={!selectedEvents.length}>Create webhook</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        {!webhooks?.length && <p className="py-6 text-center text-sm text-paper-500">No webhooks configured.</p>}
        {webhooks?.map((w) => (
          <WebhookRow key={w.id} webhook={w} onDelete={() => deleteWebhook.mutate(w.id)} />
        ))}
      </CardContent>
    </Card>
  );
}


function WebhookRow({ webhook, onDelete }: { webhook: Webhook; onDelete: () => void }) {
  const updateWebhook = useUpdateWebhook();
  const [showDeliveries, setShowDeliveries] = useState(false);
  const deliveriesQuery = useWebhookDeliveries(showDeliveries ? webhook.id : undefined);

  return (
    <div className="rounded-[var(--radius-card)] border border-line-700 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="break-all font-mono text-xs text-paper-100">{webhook.target_url}</p>
          <p className="mt-1 text-xs text-paper-500">{webhook.events.join(", ")}</p>
          <Badge variant={webhook.is_active ? "moss" : "neutral"} className="mt-2">
            {webhook.is_active ? "Active" : "Paused"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            loading={updateWebhook.isPending}
            onClick={() => updateWebhook.mutate({ id: webhook.id, data: { is_active: !webhook.is_active } })}
          >
            {webhook.is_active ? "Pause" : "Activate"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowDeliveries((value) => !value)}>
            {showDeliveries ? "Hide delivery history" : "Delivery history"}
          </Button>
          <Button size="sm" variant="danger" aria-label={"Delete webhook " + webhook.target_url} onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
      {showDeliveries && (
        <div className="mt-3 border-t border-line-700 pt-3">
          {deliveriesQuery.isLoading && <p className="text-xs text-paper-500">Loading delivery history…</p>}
          {deliveriesQuery.isError && <p role="alert" className="text-xs text-clay-400">Delivery history could not be loaded.</p>}
          {!deliveriesQuery.isLoading && !deliveriesQuery.isError && !deliveriesQuery.data?.length && (
            <p className="text-xs text-paper-500">No delivery attempts yet.</p>
          )}
          {deliveriesQuery.data?.map((delivery) => (
            <div key={delivery.id} className="flex items-center justify-between gap-3 py-2 text-xs">
              <span className="text-paper-300">{delivery.event}</span>
              <span className="text-paper-500">{delivery.response_status ?? "No response"}</span>
              <Badge variant={delivery.success ? "moss" : "clay"}>{delivery.success ? "Succeeded" : "Failed"}</Badge>
              <span className="text-paper-500">{formatDate(delivery.attempted_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
