import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import { decodeTenantIdFromToken, useAuthStore } from "@/stores/auth-store";
import type { MembershipRole } from "@/types/api";

interface InvitationPreview {
  tenant_name: string;
  email: string;
  role: MembershipRole;
  is_new_user: boolean;
}

const newUserSchema = z.object({
  full_name: z.string().min(1, "Your name is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
type NewUserForm = z.infer<typeof newUserSchema>;

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setCurrentTenant = useAuthStore((s) => s.setCurrentTenant);
  const [error, setError] = useState<string | null>(null);

  const preview = useQuery({
    queryKey: ["invitation-preview", token],
    queryFn: () => api.get<InvitationPreview>(`/tenants/invitations/${token}`),
    enabled: Boolean(token),
    retry: false,
  });

  const accept = useMutation({
    mutationFn: (data: { full_name?: string; password?: string }) =>
      api.post<{ access_token: string; refresh_token: string }>(
        "/tenants/invitations/accept",
        { token, ...data },
        { skipAuth: true }
      ),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      const tenantId = decodeTenantIdFromToken(data.access_token);
      if (tenantId) setCurrentTenant(tenantId);
      navigate("/app/dashboard");
    },
    onError: (e) => setError(e instanceof ApiError ? e.detail : "Something went wrong."),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewUserForm>({ resolver: zodResolver(newUserSchema) });

  if (!token) {
    return (
      <AuthLayout title="Invalid invitation">
        <p className="text-sm text-paper-400">This invitation link is missing its token.</p>
      </AuthLayout>
    );
  }

  if (preview.isLoading) {
    return (
      <AuthLayout title="Loading invitation...">
        <div />
      </AuthLayout>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <AuthLayout title="Invitation not found">
        <p className="text-sm text-paper-400">
          {preview.error instanceof ApiError ? preview.error.detail : "This invitation is invalid or has expired."}
        </p>
        <Link to="/login" className="mt-4 inline-block text-sm text-brass-400 hover:underline">
          Back to log in
        </Link>
      </AuthLayout>
    );
  }

  const invite = preview.data;

  return (
    <AuthLayout
      title={`Join ${invite.tenant_name}`}
      subtitle={`You've been invited as ${invite.role} \u2014 ${invite.email}`}
    >
      {invite.is_new_user ? (
        <form
          onSubmit={handleSubmit((v) => {
            setError(null);
            accept.mutate(v);
          })}
          className="space-y-4"
          noValidate
        >
          <div>
            <Label htmlFor="full_name">Your name</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && <p className="mt-1 text-xs text-clay-400">{errors.full_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Choose a password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-clay-400">{errors.password.message}</p>}
          </div>
          {error && (
            <p className="rounded-[var(--radius-card)] border border-clay-500/30 bg-clay-950 px-3 py-2 text-sm text-clay-400">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={accept.isPending}>
            Create account &amp; join
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-paper-400">
            You already have a FlowDesk account with this email. Accept the invitation to join this workspace.
          </p>
          {error && (
            <p className="rounded-[var(--radius-card)] border border-clay-500/30 bg-clay-950 px-3 py-2 text-sm text-clay-400">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            loading={accept.isPending}
            onClick={() => {
              setError(null);
              accept.mutate({});
            }}
          >
            Accept invitation
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
