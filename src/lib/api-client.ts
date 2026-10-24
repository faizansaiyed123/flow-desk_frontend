import { useAuthStore } from "@/stores/auth-store";

const API_BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

let refreshPromise: Promise<void> | null = null;

async function refreshTokens(): Promise<void> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    throw new ApiError(401, "Not authenticated.");
  }
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    logout();
    throw new ApiError(401, "Session expired. Please log in again.");
  }
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  isFormData?: boolean;
  skipAuth?: boolean;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.pathname + url.search;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = "GET", body, params, isFormData, skipAuth } = options;
  const { accessToken, currentTenantId } = useAuthStore.getState();

  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (accessToken && !skipAuth) headers["Authorization"] = `Bearer ${accessToken}`;
  if (currentTenantId) headers["X-Tenant-Id"] = currentTenantId;

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && !skipAuth && !isRetry && accessToken) {
    // Only attempt a refresh if we actually sent an access token with this
    // request — a 401 from an endpoint we called anonymously (login,
    // register, accept-invite) is a real authentication failure, not an
    // expired session, and must surface as-is rather than being masked by
    // a doomed refresh attempt.
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null;
      });
    }
    try {
      await refreshPromise;
      return request<T>(path, options, true);
    } catch {
      throw new ApiError(401, "Session expired. Please log in again.");
    }
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.blob();

  if (!res.ok) {
    const detail =
      (data && typeof data === "object" && "detail" in data && typeof data.detail === "string"
        ? data.detail
        : null) || "Something went wrong. Please try again.";
    throw new ApiError(res.status, detail);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, params?: RequestOptions["params"]) => request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
