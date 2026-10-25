import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-client";
import { decodeTenantIdFromToken, useAuthStore } from "@/stores/auth-store";
import type { MeResponse, User } from "@/types/api";
import { toast } from "@/stores/toast-store";

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<MeResponse>("/auth/me"),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { full_name?: string; avatar_url?: string | null }) =>
      api.patch<User>("/users/me", data),
    onSuccess: (user) => {
      queryClient.setQueryData<MeResponse>(["me"], (current) =>
        current
          ? {
              ...current,
              user,
              memberships: current.memberships.map((membership) => ({ ...membership, user })),
            }
          : current,
      );
      toast({ title: "Profile updated", variant: "success" });
    },
    onError: (error: Error) =>
      toast({ title: "Couldn't update profile", description: error.message, variant: "error" }),
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setCurrentTenant = useAuthStore((s) => s.setCurrentTenant);

  return useMutation({
    mutationFn: (data: { full_name: string; email: string; password: string; workspace_name: string }) =>
      api.post<TokenPair>("/auth/register", data),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      const tenantId = decodeTenantIdFromToken(data.access_token);
      if (tenantId) setCurrentTenant(tenantId);
      navigate("/app/dashboard");
    },
  });
}

export function useLogin() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setCurrentTenant = useAuthStore((s) => s.setCurrentTenant);

  return useMutation({
    mutationFn: (data: { email: string; password: string }) => api.post<TokenPair>("/auth/login", data),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      const tenantId = decodeTenantIdFromToken(data.access_token);
      if (tenantId) setCurrentTenant(tenantId);
      navigate("/app/dashboard");
    },
  });
}

export function useSwitchTenant() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setCurrentTenant = useAuthStore((s) => s.setCurrentTenant);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => api.post<TokenPair>("/auth/switch-tenant", { tenant_id: tenantId }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      const tenantId = decodeTenantIdFromToken(data.access_token);
      if (tenantId) setCurrentTenant(tenantId);
      queryClient.invalidateQueries();
      toast({ title: "Switched workspace", variant: "success" });
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  return () => {
    logout();
    queryClient.clear();
    navigate("/login");
  };
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api.post<{ message: string }>("/auth/forgot-password", { email }),
  });
}

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: { token: string; new_password: string }) =>
      api.post<{ message: string }>("/auth/reset-password", data),
    onSuccess: () => {
      toast({ title: "Password reset", description: "You can now log in.", variant: "success" });
      navigate("/login");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      api.post<{ message: string }>("/auth/change-password", data),
    onSuccess: () => toast({ title: "Password changed", variant: "success" }),
  });
}
