import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ink-950">
      <div className="hidden w-1/2 flex-col justify-between border-r border-line-700 bg-ink-900 p-12 lg:flex">
        <Link to="/login" className="font-display text-2xl font-semibold text-paper-100">
          FlowDesk
        </Link>
        <div>
          <blockquote className="font-display text-3xl leading-snug text-paper-100">
            "Every client, every project, every hour billed — kept in one ledger, not six spreadsheets."
          </blockquote>
          <p className="mt-4 text-sm text-paper-500">
            Multi-tenant project &amp; client management, built for agencies and freelancers who bill by the hour.
          </p>
        </div>
        <p className="text-xs text-paper-500">&copy; {new Date().getFullYear()} FlowDesk</p>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-xl font-semibold text-paper-100">FlowDesk</span>
          </div>
          <h1 className="font-display text-2xl text-paper-100">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-paper-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
