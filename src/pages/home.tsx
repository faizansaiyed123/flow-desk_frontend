import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Users,
    number: "01",
    title: "Clients, with context",
    description:
      "Keep contact details, notes, and the history around each relationship close at hand.",
  },
  {
    icon: FolderKanban,
    number: "02",
    title: "Projects that move",
    description:
      "Organize deliverables and tasks, follow progress, and make the next step easier to see.",
  },
  {
    icon: Clock3,
    number: "03",
    title: "Time, accounted for",
    description:
      "Keep track of time spent on client work, right alongside the projects it belongs to.",
  },
  {
    icon: Receipt,
    number: "04",
    title: "Billing in the same flow",
    description:
      "Keep invoice records connected to the client work behind them, not scattered across tools.",
  },
  {
    icon: Activity,
    number: "05",
    title: "A clearer picture of change",
    description:
      "Review recent activity and notifications in one place when work moves forward.",
  },
  {
    icon: LayoutDashboard,
    number: "06",
    title: "Your workspace, organized",
    description:
      "Move between workspaces and manage your account without losing sight of the work.",
  },
];

const previewProjects = [
  {
    name: "Brand identity",
    client: "Northstar Studio",
    progress: 72,
    tone: "bg-brass-400",
  },
  {
    name: "Website refresh",
    client: "Lumen & Co.",
    progress: 48,
    tone: "bg-sky-400",
  },
  {
    name: "Quarterly campaign",
    client: "Fieldnote",
    progress: 89,
    tone: "bg-moss-400",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-ink-950 text-paper-100">
      <header className="relative z-10 border-b border-line-700/80">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <Link
            to="/"
            className="group inline-flex shrink-0 items-center gap-3"
            aria-label="FlowDesk home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brass-400/40 bg-brass-500 text-sm font-semibold text-ink-950 shadow-[0_0_24px_rgba(198,150,62,0.12)]">
              F
            </span>
            <span className="font-display text-[23px] font-semibold tracking-tight text-paper-50">
              FlowDesk
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-8 md:flex"
          >
            <a
              href="#features"
              className="text-sm text-paper-400 transition-colors hover:text-paper-100"
            >
              Product
            </a>
            <a
              href="#workflow"
              className="text-sm text-paper-400 transition-colors hover:text-paper-100"
            >
              How it works
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-paper-300 transition-colors hover:text-paper-50 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-md bg-brass-400 px-3.5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-brass-300 sm:px-4"
            >
              Get started
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-brass-500/[0.07] blur-[120px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-56 top-[360px] h-[420px] w-[420px] rounded-full bg-sky-500/[0.045] blur-[120px]"
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:pb-28 lg:pt-24">
            <div className="max-w-[570px]">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line-600 bg-ink-900/80 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.19em] text-paper-300 sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-brass-400 shadow-[0_0_10px_rgba(217,172,92,0.65)]" />
                Client work, in better order
              </div>

              <h1 className="max-w-[650px] font-display text-[clamp(3.1rem,7vw,5.35rem)] leading-[0.99] tracking-[-0.045em] text-paper-50">
                Good work
                <br />
                deserves a
                <br />
                <span className="italic text-brass-300">clearer system.</span>
              </h1>

              <p className="mt-7 max-w-[490px] text-base leading-7 text-paper-400 sm:text-[17px] sm:leading-8">
                FlowDesk brings client relationships, project progress, tracked
                time, and invoices into one considered workspace—so you can
                spend less time keeping track and more time moving work forward.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brass-400 px-5 py-3 text-sm font-semibold text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-brass-300"
                >
                  Create your workspace
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-line-600 px-5 py-3 text-sm font-medium text-paper-200 transition-colors hover:border-line-500 hover:bg-ink-900"
                >
                  Explore FlowDesk
                </a>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line-700/80 pt-5 text-xs text-paper-500">
                <span className="inline-flex items-center gap-2">
                  <Check
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-brass-400"
                  />
                  Client and project tracking
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-brass-400"
                  />
                  Time and invoicing
                </span>
              </div>
            </div>

            <WorkspacePreview />
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-8 border-y border-line-700/80 bg-ink-900/45"
        >
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr] md:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-400">
                  The moving parts, connected
                </p>
                <h2 className="mt-4 max-w-[490px] font-display text-4xl leading-tight tracking-tight text-paper-50 sm:text-5xl">
                  Less chasing.
                  <br />
                  More doing.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-paper-400 sm:justify-self-end sm:text-base sm:leading-8">
                The work behind client work deserves a home of its own. Keep the
                details together, make progress visible, and know where to look
                when it is time for the next step.
              </p>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line-700 bg-line-700 sm:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.number}
                    className="group min-h-[218px] bg-ink-950 p-6 transition-colors hover:bg-ink-900 sm:p-7"
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-600 bg-ink-900 text-brass-300 transition-colors group-hover:border-brass-400/40 group-hover:bg-brass-950/60">
                        <Icon
                          aria-hidden="true"
                          className="h-[18px] w-[18px]"
                        />
                      </span>
                      <span className="font-mono text-[11px] text-paper-500">
                        {feature.number}
                      </span>
                    </div>
                    <h3 className="mt-7 font-display text-[22px] text-paper-100">
                      {feature.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-paper-500">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-8">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-400">
                  A steadier way to work
                </p>
                <h2 className="mt-4 max-w-md font-display text-4xl leading-tight tracking-tight text-paper-50 sm:text-5xl">
                  One flow, from first detail to final invoice.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-paper-400 sm:text-base sm:leading-8">
                  Start with the relationship. Keep the delivery moving. Bring
                  the time and billing back to the work it came from.
                </p>
              </div>

              <div className="divide-y divide-line-700 border-y border-line-700">
                <WorkflowStep
                  number="01"
                  title="Keep the relationship close"
                  description="Maintain client details and notes, then connect the work to the right people."
                  icon={Users}
                />
                <WorkflowStep
                  number="02"
                  title="Make progress easy to see"
                  description="Organize projects and tasks, follow status, and keep an eye on time spent."
                  icon={FolderKanban}
                />
                <WorkflowStep
                  number="03"
                  title="Bring the details together"
                  description="Keep invoices and recent activity within the same workspace as your delivery."
                  icon={FileText}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-24">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-line-600 bg-ink-900 px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-40 h-96 w-96 rounded-full bg-brass-500/[0.11] blur-[100px]"
            />
            <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-400">
                  Make room for the work
                </p>
                <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight text-paper-50 sm:text-5xl">
                  Get your work into flow.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-paper-400 sm:text-base">
                  Bring clients, projects, time, and billing into a workspace
                  built to keep the details in view.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-md bg-brass-400 px-5 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-brass-300 md:self-center"
              >
                Create your workspace
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-700/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5"
            aria-label="FlowDesk home"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brass-500 text-xs font-semibold text-ink-950">
              F
            </span>
            <span className="font-display text-lg font-semibold text-paper-100">
              FlowDesk
            </span>
          </Link>
          <p className="text-xs text-paper-500">
            A clearer home for client work.
          </p>
          <div className="flex items-center gap-5 text-xs text-paper-400">
            <Link
              to="/login"
              className="transition-colors hover:text-paper-100"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="transition-colors hover:text-paper-100"
            >
              Get started
            </Link>
            <span>© {new Date().getFullYear()} FlowDesk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WorkspacePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-brass-500/[0.045] blur-2xl"
      />
      <div className="relative overflow-hidden rounded-xl border border-line-600 bg-ink-900 shadow-[0_32px_100px_rgba(0,0,0,0.35)] sm:rounded-2xl">
        <div className="flex h-12 items-center justify-between border-b border-line-700 bg-ink-900/90 px-4 sm:px-5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-clay-400/80" />
            <span className="h-2 w-2 rounded-full bg-brass-400/80" />
            <span className="h-2 w-2 rounded-full bg-moss-400/80" />
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-paper-500 sm:text-[10px]">
            FlowDesk / Overview
          </span>
          <span className="rounded border border-line-600 px-2 py-1 text-[8px] font-medium uppercase tracking-wider text-paper-400 sm:text-[9px]">
            Sample
          </span>
        </div>

        <div className="grid md:grid-cols-[138px_minmax(0,1fr)]">
          <aside className="hidden border-r border-line-700 bg-ink-950/45 p-3 md:block">
            <div className="mb-6 flex items-center gap-2 px-2 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-brass-500 text-[10px] font-bold text-ink-950">
                F
              </span>
              <span className="text-xs font-semibold text-paper-200">
                FlowDesk
              </span>
            </div>
            <div className="space-y-1">
              <PreviewNavItem icon={LayoutDashboard} label="Overview" active />
              <PreviewNavItem icon={Users} label="Clients" />
              <PreviewNavItem icon={FolderKanban} label="Projects" />
              <PreviewNavItem icon={Clock3} label="Time" />
              <PreviewNavItem icon={Receipt} label="Invoices" />
            </div>
            <div className="mt-9 border-t border-line-700 pt-4">
              <p className="px-2 text-[9px] uppercase tracking-[0.16em] text-paper-500">
                Workspace
              </p>
              <div className="mt-3 flex items-center gap-2 px-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/15 text-[9px] font-semibold text-sky-400">
                  NS
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium text-paper-200">
                    Northstar Studio
                  </p>
                  <p className="text-[9px] text-paper-500">Sample workspace</p>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.17em] text-paper-500">
                  Workspace overview
                </p>
                <h3 className="mt-1 font-display text-xl text-paper-50 sm:text-2xl">
                  Good afternoon.
                </h3>
                <p className="mt-1 text-[10px] text-paper-500 sm:text-[11px]">
                  Here is what is moving this week.
                </p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-600 bg-ink-800 text-[10px] font-semibold text-brass-300">
                NS
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <PreviewMetric
                label="Active projects"
                value="06"
                note="Across clients"
              />
              <PreviewMetric
                label="Time tracked"
                value="24.5h"
                note="This week"
              />
              <PreviewMetric
                label="Open invoices"
                value="04"
                note="Need attention"
              />
            </div>

            <div className="mt-5 rounded-lg border border-line-700 bg-ink-950/55 p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-display text-base text-paper-100">
                  Projects in motion
                </h4>
                <span className="text-[9px] text-paper-500">Sample data</span>
              </div>

              <div className="mt-4 space-y-4">
                {previewProjects.map((project) => (
                  <div key={project.name}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`h-7 w-1 shrink-0 rounded-full ${project.tone}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-paper-200 sm:text-xs">
                            {project.name}
                          </p>
                          <p className="mt-0.5 truncate text-[9px] text-paper-500 sm:text-[10px]">
                            {project.client}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-paper-300">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="ml-[18px] mt-2 h-1 overflow-hidden rounded-full bg-ink-700">
                      <div
                        className={`h-full rounded-full ${project.tone}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-line-700 bg-ink-950/45 px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brass-950 text-brass-300">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium text-paper-200 sm:text-[11px]">
                    Review homepage concepts
                  </p>
                  <p className="mt-0.5 text-[9px] text-paper-500">
                    Next up · Sample task
                  </p>
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 text-[9px] text-moss-400">
                <Check aria-hidden="true" className="h-3 w-3" />
                On track
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line-700 bg-ink-950/55 px-4 py-2.5 sm:px-5">
          <span className="text-[9px] text-paper-500">
            Illustrative workspace preview
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-brass-300">
            See the whole picture
            <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-lg border border-line-600 bg-ink-900 px-4 py-3 shadow-xl sm:flex lg:-left-7">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-moss-950 text-moss-400">
          <Clock3 aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[10px] text-paper-500">Time and work</p>
          <p className="mt-0.5 text-xs font-medium text-paper-100">
            Kept together
          </p>
        </div>
      </div>

      <div className="absolute -right-2 top-[100px] hidden items-center gap-2.5 rounded-lg border border-line-600 bg-ink-900 px-3 py-3 shadow-xl xl:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-950 text-sky-400">
          <Receipt aria-hidden="true" className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[10px] font-medium text-paper-100">Invoices</p>
          <p className="text-[9px] text-paper-500">Within the same flow</p>
        </div>
      </div>
    </div>
  );
}

function PreviewNavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2 py-2 text-[10px] ${active ? "bg-ink-800 text-brass-300" : "text-paper-500"}`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line-700 bg-ink-950/55 p-2.5 sm:p-3">
      <p className="truncate text-[8px] leading-4 text-paper-500 sm:text-[9px]">
        {label}
      </p>
      <p className="mt-1 font-mono text-base text-paper-50 sm:text-lg">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[8px] text-paper-500 sm:text-[9px]">
        {note}
      </p>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <div className="grid gap-4 py-6 sm:grid-cols-[48px_minmax(0,1fr)_40px] sm:items-start sm:gap-5 sm:py-7">
      <span className="pt-1 font-mono text-xs text-brass-400">{number}</span>
      <div>
        <h3 className="font-display text-xl text-paper-100 sm:text-2xl">
          {title}
        </h3>
        <p className="mt-2 max-w-lg text-sm leading-6 text-paper-500">
          {description}
        </p>
      </div>
      <span className="hidden h-10 w-10 items-center justify-center rounded-full border border-line-600 text-paper-400 sm:flex">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
    </div>
  );
}
