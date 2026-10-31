import { http, HttpResponse } from "msw";

const FAKE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiJ0ZW5hbnQtMSJ9.fake";

export const handlers = [
  http.post("/api/v1/auth/register", async ({ request }) => {
    const body = (await request.json()) as { email: string };
    if (body.email === "taken@example.com") {
      return HttpResponse.json(
        { detail: "An account with this email already exists." },
        { status: 409 },
      );
    }
    return HttpResponse.json(
      { access_token: FAKE_TOKEN, refresh_token: FAKE_TOKEN },
      { status: 201 },
    );
  }),

  http.post("/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (
      body.email === "wrong@example.com" ||
      body.password === "wrongpassword"
    ) {
      return HttpResponse.json(
        { detail: "Incorrect email or password." },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      access_token: FAKE_TOKEN,
      refresh_token: FAKE_TOKEN,
    });
  }),

  http.get("/api/v1/auth/me", () => {
    return HttpResponse.json({
      user: {
        id: "user-1",
        email: "ada@example.com",
        full_name: "Ada Lovelace",
        avatar_url: null,
        is_email_verified: true,
        created_at: new Date().toISOString(),
      },
      memberships: [
        {
          id: "membership-1",
          role: "owner",
          tenant_id: "tenant-1",
          user: {
            id: "user-1",
            email: "ada@example.com",
            full_name: "Ada Lovelace",
            avatar_url: null,
            is_email_verified: true,
            created_at: new Date().toISOString(),
          },
        },
      ],
    });
  }),

  http.get("/api/v1/tenants/current", () => {
    return HttpResponse.json({
      id: "tenant-1",
      name: "Acme Studio",
      slug: "acme-studio",
      logo_url: null,
      plan: "free",
      is_active: true,
      created_at: new Date().toISOString(),
    });
  }),

  http.get("/api/v1/clients", () => {
    return HttpResponse.json({
      items: [
        {
          id: "client-1",
          name: "Wayne Enterprises",
          company: "Wayne Ent.",
          email: "bruce@wayne.com",
          phone: null,
          address: null,
          notes: null,
          is_archived: false,
          created_at: "",
          updated_at: "",
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
    });
  }),

  http.post("/api/v1/clients", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: "client-new",
        is_archived: false,
        created_at: "",
        updated_at: "",
        company: null,
        email: null,
        phone: null,
        notes: null,
        ...body,
      },
      { status: 201 },
    );
  }),

  http.get("/api/v1/notifications/unread-count", () =>
    HttpResponse.json({ count: 2 }),
  ),
  http.get("/api/v1/notifications", () =>
    HttpResponse.json({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
      total_pages: 1,
    }),
  ),

  http.get("/api/v1/dashboard/summary", () =>
    HttpResponse.json({
      active_project_count: 3,
      total_client_count: 5,
      total_task_count: 12,
      overdue_task_count: 1,
      completed_tasks_last_7_days: 4,
      hours_logged_last_7_days: 18.5,
      outstanding_invoice_total: 4200,
      paid_invoice_total_this_month: 1500,
      project_health: [],
      upcoming_tasks: [],
      revenue_by_month: [],
    }),
  ),
];
