import React, {
  type ButtonHTMLAttributes,
  forwardRef,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-card)] text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:focus-ring",
  {
    variants: {
      variant: {
        primary: "bg-brass-500 text-ink-950 hover:bg-brass-400",
        secondary:
          "bg-ink-800 text-paper-100 border border-line-600 hover:bg-ink-700",
        ghost: "text-paper-300 hover:bg-ink-800 hover:text-paper-100",
        outline: "border border-line-600 text-paper-100 hover:bg-ink-800",
        danger: "bg-clay-500 text-paper-50 hover:bg-clay-400",
        link: "text-brass-400 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      disabled,
      asChild,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          className={cn(buttonVariants({ variant, size }), className)}
          role="button"
          tabIndex={0}
          {...props}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </span>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
