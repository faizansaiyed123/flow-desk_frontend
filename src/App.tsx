import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { queryClient } from "@/lib/query-client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { HomePage } from "@/pages/home";

import { LoginPage } from "@/pages/auth/login";
import { RegisterPage } from "@/pages/auth/register";
import { ForgotPasswordPage } from "@/pages/auth/forgot-password";
import { ResetPasswordPage } from "@/pages/auth/reset-password";
import { AcceptInvitePage } from "@/pages/auth/accept-invite";

// Everything behind the authenticated app shell is lazy-loaded: recharts
// (dashboard) and dnd-kit (Kanban board) are the two heaviest dependencies
// in the app, and neither is needed until a user actually logs in — this
// keeps the public auth pages' bundle small and defers the rest.
const DashboardPage = lazy(() =>
  import("@/pages/dashboard").then((m) => ({ default: m.DashboardPage })),
);
const ClientsPage = lazy(() =>
  import("@/pages/clients/clients-list").then((m) => ({
    default: m.ClientsPage,
  })),
);
const ClientDetailPage = lazy(() =>
  import("@/pages/clients/client-detail").then((m) => ({
    default: m.ClientDetailPage,
  })),
);
const ProjectsPage = lazy(() =>
  import("@/pages/projects/projects-list").then((m) => ({
    default: m.ProjectsPage,
  })),
);
const ProjectDetailPage = lazy(() =>
  import("@/pages/projects/project-detail").then((m) => ({
    default: m.ProjectDetailPage,
  })),
);
const TimeTrackingPage = lazy(() =>
  import("@/pages/time-tracking").then((m) => ({
    default: m.TimeTrackingPage,
  })),
);
const InvoicesPage = lazy(() =>
  import("@/pages/invoices/invoices-list").then((m) => ({
    default: m.InvoicesPage,
  })),
);
const InvoiceDetailPage = lazy(() =>
  import("@/pages/invoices/invoice-detail").then((m) => ({
    default: m.InvoiceDetailPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/pages/settings/settings").then((m) => ({
    default: m.SettingsPage,
  })),
);
const ActivityPage = lazy(() =>
  import("@/pages/activity").then((m) => ({ default: m.ActivityPage })),
);

function PageFallback() {
  return (
    <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-ink-900" />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="activity"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ActivityPage />
                  </Suspense>
                }
              />
              <Route
                path="clients"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ClientsPage />
                  </Suspense>
                }
              />
              <Route
                path="clients/:clientId"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ClientDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="projects"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ProjectsPage />
                  </Suspense>
                }
              />
              <Route
                path="projects/:projectId"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <ProjectDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="time"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <TimeTrackingPage />
                  </Suspense>
                }
              />
              <Route
                path="invoices"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <InvoicesPage />
                  </Suspense>
                }
              />
              <Route
                path="invoices/:invoiceId"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <InvoiceDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <SettingsPage />
                  </Suspense>
                }
              />
            </Route>

            <Route
              path="*"
              element={<Navigate to="/app/dashboard" replace />}
            />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
