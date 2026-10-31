import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mock-server";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

describe("api-client", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("throws ApiError with the server's detail message on failure", async () => {
    server.use(
      http.get("/api/v1/clients/broken", () =>
        HttpResponse.json({ detail: "Nope." }, { status: 400 }),
      ),
    );
    await expect(api.get("/clients/broken")).rejects.toMatchObject({
      status: 400,
      detail: "Nope.",
    });
  });

  it("does not attempt a token refresh when no access token is set (e.g. login)", async () => {
    let refreshCalled = false;
    server.use(
      http.post("/api/v1/auth/login", () =>
        HttpResponse.json(
          { detail: "Incorrect email or password." },
          { status: 401 },
        ),
      ),
      http.post("/api/v1/auth/refresh", () => {
        refreshCalled = true;
        return HttpResponse.json({ access_token: "x", refresh_token: "y" });
      }),
    );

    await expect(
      api.post("/auth/login", { email: "a@b.com", password: "wrong" }),
    ).rejects.toMatchObject({
      status: 401,
      detail: "Incorrect email or password.",
    });
    expect(refreshCalled).toBe(false);
  });

  it("retries a request with a fresh token after a successful refresh", async () => {
    useAuthStore.getState().setTokens("expired-token", "valid-refresh-token");
    let callCount = 0;

    server.use(
      http.get("/api/v1/clients", () => {
        callCount += 1;
        if (callCount === 1)
          return HttpResponse.json(
            { detail: "Invalid or expired token." },
            { status: 401 },
          );
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
          total_pages: 1,
        });
      }),
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json({
          access_token: "new-token",
          refresh_token: "new-refresh",
        }),
      ),
    );

    const result = await api.get("/clients");
    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });
    expect(useAuthStore.getState().accessToken).toBe("new-token");
    expect(callCount).toBe(2);
  });

  it("logs the user out when the refresh token is also invalid", async () => {
    useAuthStore.getState().setTokens("expired-token", "also-expired");

    server.use(
      http.get("/api/v1/clients", () =>
        HttpResponse.json(
          { detail: "Invalid or expired token." },
          { status: 401 },
        ),
      ),
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json(
          { detail: "Invalid or expired refresh token." },
          { status: 401 },
        ),
      ),
    );

    await expect(api.get("/clients")).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
