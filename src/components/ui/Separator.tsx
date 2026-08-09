import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        "bg-border",
        className,
      )}
      {...props}
    />
  );
}
