"""Seed a deliberately malformed historical time entry before the corrective migration.

The E2E database is disposable. This verifies the upgrade that repairs manual
entries previously saved with duration_minutes but no ended_at timestamp.
"""
import os
from datetime import datetime, timezone

import psycopg2

DATABASE_URL = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://", 1)

TENANT_ID = "11111111-1111-4111-8111-111111111111"
USER_ID = "22222222-2222-4222-8222-222222222222"
PROJECT_ID = "33333333-3333-4333-8333-333333333333"
ENTRY_ID = "44444444-4444-4444-8444-444444444444"

connection = psycopg2.connect(DATABASE_URL)
connection.autocommit = True
try:
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO tenants (id, name, slug, is_active, plan) "
            "VALUES (%s, %s, %s, TRUE, %s)",
            (TENANT_ID, "Legacy Timer Migration Test", "legacy-manual-time-migration-test", "free"),
        )
        cursor.execute(
            "INSERT INTO users (id, email, hashed_password, full_name, is_active, is_email_verified, is_superuser) "
            "VALUES (%s, %s, %s, %s, TRUE, FALSE, FALSE)",
            (USER_ID, "legacy-manual-time-migration@example.com", "test-hash-not-used", "Legacy Timer Test User"),
        )
        cursor.execute(
            "INSERT INTO projects (id, tenant_id, name, status, color, billing_type, is_archived) "
            "VALUES (%s, %s, %s, 'ACTIVE', '#c6963e', 'NON_BILLABLE', FALSE)",
            (PROJECT_ID, TENANT_ID, "Legacy Manual Time Migration Project"),
        )
        cursor.execute(
            "INSERT INTO time_entries "
            "(id, tenant_id, project_id, user_id, started_at, ended_at, duration_minutes, "
            "description, is_billable, is_invoiced) "
            "VALUES (%s, %s, %s, %s, %s, NULL, 45, %s, TRUE, FALSE)",
            (
                ENTRY_ID,
                TENANT_ID,
                PROJECT_ID,
                USER_ID,
                datetime(2026, 1, 1, 9, 0, tzinfo=timezone.utc),
                "Legacy duration-only manual entry",
            ),
        )
    print("Seeded one legacy manual time entry with duration_minutes=45 and ended_at=NULL.")
finally:
    connection.close()
