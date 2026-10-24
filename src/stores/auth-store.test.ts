import { describe, it, expect, beforeEach } from "vitest";
import { decodeTenantIdFromToken, useAuthStore } from "@/stores/auth-store";

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

describe("auth-store", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("starts unauthenticated", () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it("becomes authenticated after setTokens", () => {
    useAuthStore.getState().setTokens("access", "refresh");
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("access");
  });

  it("clears everything on logout", () => {
    useAuthStore.getState().setTokens("access", "refresh");
    useAuthStore.getState().setCurrentTenant("tenant-1");
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(useAuthStore.getState().currentTenantId).toBeNull();
  });

  it("decodes the tenant_id claim from a well-formed JWT", () => {
    const token = fakeJwt({ sub: "user-1", tenant_id: "tenant-42" });
    expect(decodeTenantIdFromToken(token)).toBe("tenant-42");
  });

  it("returns null for a malformed token instead of throwing", () => {
    expect(decodeTenantIdFromToken("not-a-jwt")).toBeNull();
  });

  it("returns null when the token has no tenant_id claim", () => {
    const token = fakeJwt({ sub: "user-1" });
    expect(decodeTenantIdFromToken(token)).toBeNull();
  });
});
