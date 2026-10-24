"""Verify the corrective migration completed the legacy manual time entry."""
import os
from datetime import timedelta

import psycopg2

DATABASE_URL = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://", 1)
ENTRY_ID = "44444444-4444-4444-8444-444444444444"

connection = psycopg2.connect(DATABASE_URL)
try:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT started_at, ended_at, duration_minutes FROM time_entries WHERE id = %s",
            (ENTRY_ID,),
        )
        row = cursor.fetchone()
    if row is None:
        raise AssertionError("The legacy manual time entry disappeared during migration.")
    started_at, ended_at, duration_minutes = row
    if ended_at is None:
        raise AssertionError("The migration did not backfill ended_at.")
    if duration_minutes != 45 or ended_at - started_at != timedelta(minutes=45):
        raise AssertionError("The migration did not backfill the correct ended_at timestamp.")
    print("PASS: historical duration-only manual entry was backfilled to a completed interval.")
finally:
    connection.close()
