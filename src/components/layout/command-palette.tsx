import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, Loader2 } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { cn } from "@/lib/utils";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const { data, isFetching } = useSearch(query);
  const navigate = useNavigate();

  function go(url: string) {
    onOpenChange(false);
    setQuery("");
    navigate(`/app${url}`);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2 rounded-[var(--radius-card)] border border-line-700 bg-ink-900 shadow-2xl focus:outline-none">
          <DialogPrimitive.Title className="sr-only">
            Search
          </DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-line-700 px-4 py-3">
            {isFetching ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-paper-500" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-paper-500" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, projects, tasks..."
              className="flex-1 bg-transparent text-sm text-paper-100 placeholder:text-paper-500 focus:outline-none"
            />
            <kbd className="rounded border border-line-600 px-1.5 py-0.5 text-[10px] text-paper-500">
              Esc
            </kbd>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {query.trim().length < 2 && (
              <p className="px-3 py-6 text-center text-sm text-paper-500">
                Type at least 2 characters to search.
              </p>
            )}
            {query.trim().length >= 2 && data?.results.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-paper-500">
                No results for "{query}".
              </p>
            )}
            {data?.results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => go(r.url)}
                className="flex w-full items-center justify-between rounded-[var(--radius-card)] px-3 py-2.5 text-left text-sm hover:bg-ink-800"
              >
                <div>
                  <span className="text-paper-100">{r.title}</span>
                  {r.subtitle && (
                    <span className="ml-2 text-xs text-paper-500">
                      {r.subtitle}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    r.type === "client" && "bg-sky-950 text-sky-400",
                    r.type === "project" && "bg-brass-950 text-brass-300",
                    r.type === "task" && "bg-moss-950 text-moss-400",
                  )}
                >
                  {r.type}
                </span>
              </button>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
