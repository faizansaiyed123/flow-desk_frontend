import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export function Label({
  className,
  htmlFor,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { htmlFor?: string }) {
  return (
    <LabelPrimitive.Root
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-medium text-paper-300 mb-1.5 block",
        className,
      )}
      {...props}
    />
  );
}
