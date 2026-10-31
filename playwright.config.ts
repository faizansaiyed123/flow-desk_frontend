import { defineConfig, devices } from "@playwright/test";

/**
 * Full end-to-end suite against a REAL running backend + frontend.
 *
 * Prerequisites (see README-TESTING.md):
 *   1. PostgreSQL running with a `flowdesk_e2e` database.
 *   2. Backend running on http://localhost:8000 pointed at that database.
 *   3. `npx playwright install` to fetch browser binaries (requires normal
 *      internet access — this could not be done inside the sandboxed
 *      container these tests were authored in, so run it once locally
 *      before `npm run e2e`).
 *
 * `webServer` below starts the Vite dev server automatically; it assumes
 * the backend is already running separately (a true integration test
 * needs a real API, not a mock).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
