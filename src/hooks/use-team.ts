import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Invitation, MembershipRole, TeamMember, Tenant } from "@/types/api";
import { toast } from "@/stores/toast-store";

export function useCurrentTenant() {
  return useQuery({ queryKey: ["tenant", "current"], queryFn: () => api.get<Tenant>("/tenants/current") });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; logo_url?: string }) => api.patch<Tenant>("/tenants/current", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant"] });
      toast({ title: "Workspace updated", variant: "success" });
    },
  });
}

export function useTeamMembers() {
  return useQuery({ queryKey: ["team-members"], queryFn: () => api.get<TeamMember[]>("/tenants/members") });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: MembershipRole }) =>
      api.patch(`/tenants/members/${membershipId}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Role updated", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Couldn't update role", description: e.message, variant: "error" }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => api.delete(`/tenants/members/${membershipId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Member removed", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Couldn't remove member", description: e.message, variant: "error" }),
  });
}

export function useInvitations() {
  return useQuery({ queryKey: ["invitations"], queryFn: () => api.get<Invitation[]>("/tenants/invitations") });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: MembershipRole }) => api.post<Invitation>("/tenants/invitations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      toast({ title: "Invitation sent", variant: "success" });
    },
    onError: (e: Error) => toast({ title: "Couldn't send invitation", description: e.message, variant: "error" }),
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/invitations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      toast({ title: "Invitation revoked", variant: "success" });
    },
  });
}
