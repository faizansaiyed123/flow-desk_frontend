import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-ink-800 text-paper-300 border border-line-600",
        brass: "bg-brass-950 text-brass-300 border border-brass-600/40",
        moss: "bg-moss-950 text-moss-400 border border-moss-500/30",
        clay: "bg-clay-950 text-clay-400 border border-clay-500/30",
        sky: "bg-sky-950 text-sky-400 border border-sky-500/30",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** A small solid dot + label — used for status where a full pill would be
 * visual noise (e.g. dense tables). Keeps color meaningful, not decorative. */
export function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-paper-300">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
