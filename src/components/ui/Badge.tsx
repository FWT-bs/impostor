import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-brand/16 bg-blue-soft text-brand",
        secondary: "border-border bg-card/85 text-muted",
        pink: "border-heat/16 bg-heat/12 text-heat",
        cyan: "border-aqua/18 bg-aqua/10 text-aqua-2",
        live: "border-lime/18 bg-lime/10 text-lime",
        locked: "border-muted/20 bg-card/70 text-muted-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
