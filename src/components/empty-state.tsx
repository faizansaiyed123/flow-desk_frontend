import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line-600 py-16 text-center">
      <Icon className="h-8 w-8 text-paper-500" />
      <h3 className="mt-4 font-display text-lg text-paper-100">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-paper-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
