import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentTenantId: string | null;
  setTokens: (access: string, refresh: string) => void;
  setCurrentTenant: (tenantId: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      currentTenantId: null,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),
      setCurrentTenant: (tenantId) => set({ currentTenantId: tenantId }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, currentTenantId: null }),
      isAuthenticated: () => Boolean(get().accessToken),
    }),
    { name: "flowdesk-auth" },
  ),
);

/** Decode the tenant_id claim baked into a JWT access token without a
 * network call — used right after login/switch-tenant to keep the store's
 * currentTenantId in sync with what the token actually authorizes. */
export function decodeTenantIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.tenant_id ?? null;
  } catch {
    return null;
  }
}
