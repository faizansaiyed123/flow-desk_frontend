import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  Receipt,
  Settings,
  History,
  Search,
  Bell,
  ChevronsUpDown,
  LogOut,
  Command,
  Menu,
  X,
} from "lucide-react";
import { useMe, useLogout, useSwitchTenant } from "@/hooks/use-auth";
import {
  useUnreadCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/hooks/use-notifications";
import { useCurrentTenant } from "@/hooks/use-team";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/layout/command-palette";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Membership } from "@/types/api";

const NAV_ITEMS = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/activity", label: "Activity", icon: History },
  { to: "/app/clients", label: "Clients", icon: Users },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/time", label: "Time", icon: Clock },
  { to: "/app/invoices", label: "Invoices", icon: Receipt },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const { data: me } = useMe();
  const logout = useLogout();
  const currentTenantId = useAuthStore((s) => s.currentTenantId);
  const switchTenant = useSwitchTenant();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const currentMembership =
    me?.memberships.find((m) => m.tenant_id === currentTenantId) ??
    me?.memberships[0];

  return (
    <div className="flex h-screen bg-ink-950">
      {/* Mobile off-canvas overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-line-700 bg-ink-900 transition-transform md:static md:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-line-700 px-5">
          <span className="font-display text-lg font-semibold text-paper-100">
            FlowDesk
          </span>
          <button
            className="text-paper-400 hover:text-paper-100 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[var(--radius-card)] px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-ink-800 text-brass-400"
                    : "text-paper-400 hover:bg-ink-800 hover:text-paper-100",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line-700 p-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-[var(--radius-card)] border border-line-600 px-3 py-2 text-xs text-paper-500 hover:border-line-600 hover:bg-ink-800"
          >
            <Search className="h-3.5 w-3.5" />
            Search
            <span className="ml-auto flex items-center gap-0.5 text-paper-500">
              <Command className="h-3 w-3" />K
            </span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line-700 bg-ink-950 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="text-paper-400 hover:text-paper-100 md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <TenantSwitcher
              memberships={me?.memberships ?? []}
              currentTenantId={currentTenantId}
              onSwitch={(id) => switchTenant.mutate(id)}
            />
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <NotificationsMenu />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus-visible:focus-ring">
                <Avatar
                  name={me?.user.full_name ?? "?"}
                  src={me?.user.avatar_url}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{me?.user.full_name}</DropdownMenuLabel>
                <div className="px-2.5 pb-2 text-xs text-paper-500">
                  {me?.user.email}
                </div>
                {currentMembership && (
                  <div className="px-2.5 pb-2">
                    <Badge variant="brass" className="capitalize">
                      {currentMembership.role}
                    </Badge>
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function TenantSwitcher({
  memberships,
  currentTenantId,
  onSwitch,
}: {
  memberships: Membership[];
  currentTenantId: string | null;
  onSwitch: (id: string) => void;
}) {
  const { data: tenant } = useCurrentTenant();
  if (memberships.length <= 1) {
    return (
      <span className="font-display text-base text-paper-100">
        {tenant?.name ?? "Workspace"}
      </span>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-[var(--radius-card)] px-2 py-1 text-base font-display text-paper-100 hover:bg-ink-800 focus-visible:focus-ring">
        {tenant?.name ?? "Workspace"}
        <ChevronsUpDown className="h-3.5 w-3.5 text-paper-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.tenant_id}
            onClick={() => onSwitch(m.tenant_id)}
            className={m.tenant_id === currentTenantId ? "text-brass-400" : ""}
          >
            {m.tenant_id === currentTenantId ? "\u2713 " : ""}
            {m.tenant_id.slice(0, 8)}… ({m.role})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationsMenu() {
  const { data: unread } = useUnreadCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-card)] text-paper-400 hover:bg-ink-800 hover:text-paper-100 focus-visible:focus-ring">
        <Bell className="h-4 w-4" />
        {Boolean(unread?.count) && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brass-500" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <DropdownMenuLabel className="px-0 py-0">
            Notifications
          </DropdownMenuLabel>
          {Boolean(unread?.count) && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-brass-400 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {!notifications?.items.length && (
          <div className="px-2.5 py-6 text-center text-sm text-paper-500">
            You're all caught up.
          </div>
        )}
        <div className="max-h-80 overflow-y-auto">
          {notifications?.items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn(
                "flex-col items-start gap-0.5",
                !n.is_read && "bg-ink-700/50",
              )}
              onClick={() => {
                markRead.mutate(n.id);
                if (n.link) navigate(n.link);
              }}
            >
              <span className="text-sm text-paper-100">{n.title}</span>
              <span className="text-xs text-paper-500">
                {formatRelativeTime(n.created_at)}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
