import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-[var(--radius-card)] border p-4 shadow-xl animate-in slide-in-from-bottom-2",
            t.variant === "success" && "border-moss-500/30 bg-moss-950",
            t.variant === "error" && "border-clay-500/30 bg-clay-950",
            (!t.variant || t.variant === "default") &&
              "border-line-700 bg-ink-800",
          )}
        >
          {t.variant === "success" && (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-moss-400" />
          )}
          {t.variant === "error" && (
            <XCircle className="h-5 w-5 shrink-0 text-clay-400" />
          )}
          {(!t.variant || t.variant === "default") && (
            <Info className="h-5 w-5 shrink-0 text-sky-400" />
          )}
          <div className="flex-1 text-sm">
            <p className="font-medium text-paper-100">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-paper-400">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-paper-500 hover:text-paper-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
