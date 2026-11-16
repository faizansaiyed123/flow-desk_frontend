import { beforeEach, describe, expect, it } from "vitest";
import { demoRequest, resetDemoData, DEMO_PASSWORD } from "@/lib/demo-api";
import { useAuthStore } from "@/stores/auth-store";

async function signIn(email = "alex@northstar.demo") {
  const tokens = await demoRequest<{ access_token: string; refresh_token: string }>("/auth/login", {
    method: "POST",
    body: { email, password: DEMO_PASSWORD },
  });
  const payload = JSON.parse(atob(tokens.access_token.split(".")[1]));
  useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
  useAuthStore.getState().setCurrentTenant(payload.tenant_id);
}

describe("FlowDesk browser demo", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
    resetDemoData();
  });

  it("authenticates the sample roles and returns workspace memberships", async () => {
    await signIn();
    const me = await demoRequest<{ user: { email: string }; memberships: Array<{ role: string }> }>("/auth/me");
    expect(me.user.email).toBe("alex@northstar.demo");
    expect(me.memberships.map((membership) => membership.role)).toContain("owner");
  });

  it("supports client, project, and task workflow changes", async () => {
    await signIn();
    const clients = await demoRequest<{ items: Array<{ id: string }>; total: number }>("/clients", { params: { search: "Aperture" } });
    expect(clients.total).toBe(1);

    const created = await demoRequest<{ id: string; title: string }>("/tasks", {
      method: "POST",
      body: { project_id: "project_brand", title: "Prepare handoff deck", priority: "high" },
    });
    expect(created.title).toBe("Prepare handoff deck");

    const updated = await demoRequest<{ status: string; completed_at: string | null }>("/tasks/" + created.id, {
      method: "PATCH",
      body: { status: "done" },
    });
    expect(updated.status).toBe("done");
    expect(updated.completed_at).not.toBeNull();
  });

  it("generates an invoice from unbilled project time and locks those entries", async () => {
    await signIn();
    const invoice = await demoRequest<{ total: number; line_items: unknown[]; status: string }>("/invoices/generate-from-time", {
      method: "POST",
      body: { project_id: "project_brand", issue_date: "2026-11-16", due_date: "2026-12-16", tax_rate: 0 },
    });
    expect(invoice.status).toBe("draft");
    expect(invoice.total).toBeGreaterThan(0);
    expect(invoice.line_items).toHaveLength(1);
    const entries = await demoRequest<{ items: Array<{ is_invoiced: boolean }> }>("/time-entries", {
      params: { project_id: "project_brand" },
    });
    expect(entries.items.filter((entry) => entry.is_invoiced)).toHaveLength(2);
  });

  it("switches workspace context without sharing the primary tenant's clients", async () => {
    await signIn();
    const switched = await demoRequest<{ access_token: string; refresh_token: string }>("/auth/switch-tenant", {
      method: "POST",
      body: { tenant_id: "tenant_flowdesk_labs" },
    });
    const payload = JSON.parse(atob(switched.access_token.split(".")[1]));
    useAuthStore.getState().setTokens(switched.access_token, switched.refresh_token);
    useAuthStore.getState().setCurrentTenant(payload.tenant_id);
    const clients = await demoRequest<{ items: Array<{ name: string }>; total: number }>("/clients");
    expect(clients.total).toBe(1);
    expect(clients.items[0].name).toBe("Prototype Partners");
  });
});
