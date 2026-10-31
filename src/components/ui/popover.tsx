import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popover>) {
  return <PopoverPrimitive.Popover {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  align?: React.ComponentProps<typeof PopoverPrimitive.Content>["align"];
  side?: React.ComponentProps<typeof PopoverPrimitive.Content>["side"];
  sideOffset?: number;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-[var(--radius-card)] border border-line-700 bg-ink-900 p-3 text-paper-100 shadow-xl outline-none",
          "data-[side=bottom]:translate-y-1 data-[side=top]:translate-y-[-1px]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
