# FlowDesk interactive demo

The `demo` branch provides a browser-only simulation of FlowDesk's client and project workspace. The recommended recruiter walkthrough requires no API server, database, environment variables, or external integrations.

## Start the frontend demo

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`, choose **Explore demo**, and select a role on the login page.

## Demo accounts

All four accounts use password `Demo1234!`.

| Role | Email |
|---|---|
| Owner | `alex@northstar.demo` |
| Admin | `jordan@northstar.demo` |
| Member | `sam@northstar.demo` |
| Viewer | `taylor@northstar.demo` |

## Recommended walkthrough

1. **Dashboard:** review active project health, tasks due soon, weekly hours, outstanding invoices, and recent revenue.
2. **Clients:** open Aperture Studio or Lumen & Co.; inspect the notes and relationship/work statistics; create or update a client.
3. **Projects:** open Brand identity system or Website refresh; inspect client linkage, project health, and billing configuration.
4. **Kanban:** move tasks between Backlog, To Do, In Progress, In Review, and Done; open a task to change priority, assignee, due date, estimate, description, and comments.
5. **Time:** start and stop a timer or add a manual entry; inspect billable and invoiced status.
6. **Invoices:** inspect paid, sent, overdue, and draft examples. Generate a draft invoice from a project's unbilled hourly entries, then send it or mark it paid.
7. **Workspace:** inspect members, invitations, API keys, webhooks, notification preferences, and recent activity. The Owner account can switch between Northstar Creative and FlowDesk Labs.

## What is simulated

- API calls are intercepted by `src/lib/demo-api.ts`; application data is stored in this browser's localStorage under `flowdesk_browser_demo_v1`.
- Changes survive reloads in the same browser. The in-app **Reset sample data** control restores the initial data and signs out.
- Login, tenant switching, client/project/task CRUD, comments, time tracking, invoices, activity, notifications, and integration settings are local simulations.
- API key secrets are demo placeholders. Webhook calls are not delivered. Attachment uploads save file metadata only; uploaded bytes are not sent to a service. No email, payment, or external integration is contacted.
- The banner in the signed-in workspace identifies the local-only simulation.

## Optional local backend API

The companion backend repository's `demo` branch contains an independent in-memory FastAPI simulator. It is useful for exploring API routes, but it is not required by this frontend demo.

To use the backend simulator instead of the browser-local simulator, start that backend on `127.0.0.1:8001`, then create frontend `.env.local`:

```env
VITE_FLOWDESK_BROWSER_DEMO=false
VITE_API_BASE_URL=http://127.0.0.1:8001/api/v1
```

Restart the Vite dev server after changing environment variables. See the backend repository's `DEMO.md` for its local-only boundaries and API credentials.

## Checks

```bash
npm ci
npm run lint
npm test
npm run build
```
