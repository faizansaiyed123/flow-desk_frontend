# Frontend Dependency Security Check

## Vite high-severity advisory

The frontend previously locked Vite at `8.3.0`. That version is in the affected range for [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm). The patched Vite 8.3 line starts at `8.3.3`; this project now declares `^8.3.5` and locks `8.3.5`.

## Verification

The dependency-remediation GitHub Actions run passed:

- `npm audit --audit-level=high`
- frontend lint
- TypeScript production build
- frontend unit tests

Run: https://github.com/faizansaiyed123/flow-desk_frontend/actions/runs/40162260832

The full-stack workflow is also run on the pull request so PostgreSQL migrations, backend API tests, real-browser journeys, and direct database/file-storage assertions validate the exact dependency-lock revision before merge.

This note reports the high-severity threshold check. It does not claim that all low/moderate advisories are absent; refer to the action log for the complete audit output.
