"""Assert that the browser walkthrough left real records in PostgreSQL.

Run after the visual Playwright test, against the dedicated flowdesk_e2e
database. This is intentionally a read-only check; it never edits the data.
"""
import os
from pathlib import Path

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
            "SELECT id, name, slug FROM tenants WHERE slug = %s ORDER BY created_at DESC LIMIT 1",
            ("flowdesk-visual-walkthrough",),
        )
        tenant_row = cursor.fetchone()
    if tenant_row is None:
        with connection.cursor() as cursor:
            cursor.execute("SELECT name, slug FROM tenants ORDER BY created_at DESC LIMIT 10")
            observed_tenants = cursor.fetchall()
        raise AssertionError(
            "The registered workspace slug was not found in PostgreSQL; "
            f"observed tenant name/slug pairs: {observed_tenants!r}"
        )
    tenant_id, persisted_tenant_name, persisted_tenant_slug = tenant_row
    print(
        "PASS PostgreSQL: registered workspace located by stable slug "
        f"{persisted_tenant_slug!r}; current persisted name is {persisted_tenant_name!r}"
    )

    check(
        "workspace rename persisted",
        "SELECT EXISTS (SELECT 1 FROM tenants WHERE id = %s AND name = %s)",
        (tenant_id, "FlowDesk Visual Walkthrough Updated"),
    )

    check(
        "profile change persisted to the member user row",
        "SELECT EXISTS (SELECT 1 FROM users u JOIN memberships m ON m.user_id = u.id "
        "WHERE m.tenant_id = %s AND u.full_name = %s)",
        (tenant_id, "FlowDesk Walkthrough User Updated"),
    )

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
        "disposable project was removed after the delete confirmation",
        "SELECT NOT EXISTS (SELECT 1 FROM projects WHERE tenant_id = %s AND name = %s)",
        (tenant_id, "Project lifecycle cleanup"),
    )

    check(
        "task status persisted after changing the Kanban column",
        "SELECT EXISTS (SELECT 1 FROM tasks WHERE tenant_id = %s AND project_id = %s "
        "AND title = %s AND lower(status::text) = %s)",
        (tenant_id, project_id, "Prepare first milestone", "in_progress"),
    )

    check(
        "both notification tasks persisted with the invited member assigned",
        "SELECT COUNT(*) = 2 FROM tasks WHERE tenant_id = %s "
        "AND title IN (%s, %s) AND assignee_id IS NOT NULL",
        (tenant_id, "Notification individual read", "Notification bulk read"),
    )

    check(
        "individual and mark-all-read notification state persisted",
        "SELECT COUNT(*) = 2 AND bool_and(is_read) FROM notifications WHERE tenant_id = %s "
        "AND (title ILIKE %s OR title ILIKE %s)",
        (tenant_id, "%Notification individual read%", "%Notification bulk read%"),
    )

    check(
        "manual time entry persisted with the requested duration",
        "SELECT EXISTS (SELECT 1 FROM time_entries WHERE tenant_id = %s AND project_id = %s "
        "AND description = %s AND duration_minutes = %s AND ended_at IS NOT NULL)",
        (tenant_id, project_id, "Manual verification entry edited", 45),
    )

    check(
        "temporary time entry was deleted from PostgreSQL",
        "SELECT NOT EXISTS (SELECT 1 FROM time_entries WHERE tenant_id = %s "
        "AND project_id = %s AND description = %s)",
        (tenant_id, project_id, "Temporary time entry to delete"),
    )

    check(
        "invoice, edited notes, total and paid status persisted",
        "SELECT EXISTS (SELECT 1 FROM invoices i JOIN clients c ON c.id = i.client_id "
        "WHERE i.tenant_id = %s AND c.name = %s AND lower(i.status::text) = %s "
        "AND i.total = %s AND i.notes = %s)",
        (tenant_id, "Walkthrough Client", "paid", 100, "Edited in the full-stack walkthrough."),
    )

    check(
        "invoice line item persisted",
        "SELECT EXISTS (SELECT 1 FROM invoice_line_items li JOIN invoices i ON i.id = li.invoice_id "
        "WHERE i.tenant_id = %s AND li.description = %s AND li.quantity = %s AND li.unit_price = %s)",
        (tenant_id, "Walkthrough implementation", 2, 50),
    )

    check(
        "disposable draft invoice was deleted from PostgreSQL",
        "SELECT NOT EXISTS (SELECT 1 FROM invoices i JOIN invoice_line_items li "
        "ON li.invoice_id = i.id WHERE i.tenant_id = %s AND li.description = %s)",
        (tenant_id, "Disposable draft invoice"),
    )

    check(
        "past-due invoice transition persisted as overdue",
        "SELECT EXISTS (SELECT 1 FROM invoices i JOIN invoice_line_items li ON li.invoice_id = i.id "
        "WHERE i.tenant_id = %s AND lower(i.status::text) = %s AND i.due_date < CURRENT_DATE "
        "AND li.description = %s AND li.amount = %s)",
        (tenant_id, "overdue", "Overdue walkthrough work", 25),
    )

    check(
        "separate draft invoice persisted as void",
        "SELECT EXISTS (SELECT 1 FROM invoices i JOIN invoice_line_items li ON li.invoice_id = i.id "
        "WHERE i.tenant_id = %s AND lower(i.status::text) = %s "
        "AND li.description = %s AND li.amount = %s)",
        (tenant_id, "void", "Void walkthrough work", 15),
    )

    check(
        "team invitation persisted as pending",
        "SELECT EXISTS (SELECT 1 FROM invitations WHERE tenant_id = %s AND email = %s "
        "AND lower(status::text) = %s)",
        (tenant_id, "walkthrough-invitation@example.com", "pending"),
    )

    check(
        "accepted invite created the new team member with updated admin role",
        "SELECT EXISTS (SELECT 1 FROM users u JOIN memberships m ON m.user_id = u.id "
        "WHERE m.tenant_id = %s AND u.full_name = %s AND lower(m.role::text) = %s)",
        (tenant_id, "FlowDesk Invited Member", "admin"),
    )

    check(
        "revoked invitation status persisted",
        "SELECT EXISTS (SELECT 1 FROM invitations WHERE tenant_id = %s AND email = %s "
        "AND lower(status::text) = %s)",
        (tenant_id, "walkthrough-revoked@example.com", "revoked"),
    )

    check(
        "API key persisted as a hash, then revoked without exposing plaintext",
        "SELECT EXISTS (SELECT 1 FROM api_keys WHERE tenant_id = %s "
        "AND name = %s AND hashed_key IS NOT NULL AND length(hashed_key) > 20 "
        "AND is_active = FALSE AND revoked_at IS NOT NULL)",
        (tenant_id, "Walkthrough automation key"),
    )

    check(
        "webhook configuration persisted active after pause/reactivate",
        "SELECT EXISTS (SELECT 1 FROM webhooks WHERE tenant_id = %s AND target_url = %s "
        "AND is_active = TRUE)",
        (tenant_id, "https://hooks.example.com/flowdesk-walkthrough"),
    )

    check(
        "disposable webhook was deleted through the UI and API",
        "SELECT NOT EXISTS (SELECT 1 FROM webhooks WHERE tenant_id = %s AND target_url = %s)",
        (tenant_id, "https://hooks.example.com/flowdesk-delete-walkthrough"),
    )

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT storage_path, size_bytes, content_type FROM attachments "
            "WHERE tenant_id = %s AND project_id = %s AND file_name = %s LIMIT 1",
            (tenant_id, project_id, "walkthrough-evidence.txt"),
        )
        attachment = cursor.fetchone()
    if attachment is None:
        raise AssertionError("PostgreSQL verification failed: attachment record persisted")
    storage_path, size_bytes, content_type = attachment
    expected_content = (
        b"FlowDesk real full-stack walkthrough attachment. "
        b"PostgreSQL and disk storage are verified."
    )
    stored_file = Path(storage_path)
    if not stored_file.is_file():
        raise AssertionError(f"Uploaded file is missing from storage: {stored_file}")
    if stored_file.read_bytes() != expected_content:
        raise AssertionError("Downloaded file bytes differ from the original upload.")
    if size_bytes != len(expected_content) or content_type != "text/plain":
        raise AssertionError("Stored attachment size or content type is incorrect.")
    print("PASS PostgreSQL + disk: attachment row and original file bytes persisted")

    check(
        "temporary attachment row was removed after deletion",
        "SELECT NOT EXISTS (SELECT 1 FROM attachments WHERE tenant_id = %s "
        "AND project_id = %s AND file_name = %s)",
        (tenant_id, project_id, "temporary-delete.txt"),
    )

    check(
        "attachment deletion was recorded in the activity audit trail",
        "SELECT EXISTS (SELECT 1 FROM activity_logs WHERE tenant_id = %s "
        "AND entity_label = %s AND action = %s)",
        (tenant_id, "temporary-delete.txt", "attachment.deleted"),
    )

    check(
        "file upload was recorded in workspace activity history",
        "SELECT EXISTS (SELECT 1 FROM activity_logs WHERE tenant_id = %s "
        "AND entity_label = %s AND action = %s)",
        (tenant_id, "walkthrough-evidence.txt", "attachment.uploaded"),
    )

    print("PASS: all browser-walkthrough records verified in PostgreSQL.")
finally:
    connection.close()
