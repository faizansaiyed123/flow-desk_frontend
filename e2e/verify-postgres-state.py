"""Assert that the browser walkthrough left real records in PostgreSQL.

Run after the visual Playwright test, against the dedicated flowdesk_e2e
database. This is intentionally a read-only check; it never edits the data.
"""
import os

import psycopg2


database_url = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://", 1)
connection = psycopg2.connect(database_url)
connection.autocommit = True


def check(label: str, sql: str, parameters: tuple = ()) -> None:
    with connection.cursor() as cursor:
        cursor.execute(sql, parameters)
        row = cursor.fetchone()
    if row is None or not row[0]:
        raise AssertionError(f"PostgreSQL verification failed: {label}")
    print(f"PASS PostgreSQL: {label}")


try:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id FROM tenants WHERE name = %s ORDER BY created_at DESC LIMIT 1",
            ("FlowDesk Visual Walkthrough",),
        )
        tenant_row = cursor.fetchone()
    if tenant_row is None:
        raise AssertionError("The walkthrough workspace was not found in PostgreSQL.")
    tenant_id = tenant_row[0]
    print("PASS PostgreSQL: registered workspace persisted")

    check(
        "client and edited notes persisted",
        "SELECT EXISTS (SELECT 1 FROM clients WHERE tenant_id = %s AND name = %s "
        "AND notes = %s)",
        (tenant_id, "Walkthrough Client", "Confirmed in the real full-stack walkthrough."),
    )

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id FROM projects WHERE tenant_id = %s AND name = %s LIMIT 1",
            (tenant_id, "Walkthrough Project"),
        )
        project_row = cursor.fetchone()
    if project_row is None:
        raise AssertionError("The walkthrough project was not found in PostgreSQL.")
    project_id = project_row[0]
    print("PASS PostgreSQL: project persisted")

    check(
        "task status persisted after changing the Kanban column",
        "SELECT EXISTS (SELECT 1 FROM tasks WHERE tenant_id = %s AND project_id = %s "
        "AND title = %s AND lower(status::text) = %s)",
        (tenant_id, project_id, "Prepare first milestone", "in_progress"),
    )

    check(
        "manual time entry persisted with the requested duration",
        "SELECT EXISTS (SELECT 1 FROM time_entries WHERE tenant_id = %s AND project_id = %s "
        "AND description = %s AND duration_minutes = %s AND ended_at IS NOT NULL)",
        (tenant_id, project_id, "Manual verification entry", 45),
    )

    check(
        "invoice and total persisted in paid status",
        "SELECT EXISTS (SELECT 1 FROM invoices i JOIN clients c ON c.id = i.client_id "
        "WHERE i.tenant_id = %s AND c.name = %s AND lower(i.status::text) = %s "
        "AND i.total = %s)",
        (tenant_id, "Walkthrough Client", "paid", 100),
    )

    check(
        "invoice line item persisted",
        "SELECT EXISTS (SELECT 1 FROM invoice_line_items li JOIN invoices i ON i.id = li.invoice_id "
        "WHERE i.tenant_id = %s AND li.description = %s AND li.quantity = %s AND li.unit_price = %s)",
        (tenant_id, "Walkthrough implementation", 2, 50),
    )

    check(
        "team invitation persisted as pending",
        "SELECT EXISTS (SELECT 1 FROM invitations WHERE tenant_id = %s AND email = %s "
        "AND lower(status::text) = %s)",
        (tenant_id, "walkthrough-invitation@example.com", "pending"),
    )

    check(
        "API key record persisted without storing its plaintext value",
        "SELECT EXISTS (SELECT 1 FROM api_keys WHERE tenant_id = %s "
        "AND name = %s AND hashed_key IS NOT NULL AND length(hashed_key) > 20)",
        (tenant_id, "Walkthrough automation key"),
    )

    check(
        "webhook configuration persisted",
        "SELECT EXISTS (SELECT 1 FROM webhooks WHERE tenant_id = %s AND target_url = %s "
        "AND is_active = TRUE)",
        (tenant_id, "https://hooks.example.com/flowdesk-walkthrough"),
    )

    print("PASS: all browser-walkthrough records verified in PostgreSQL.")
finally:
    connection.close()
