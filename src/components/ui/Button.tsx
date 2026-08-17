"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
  forwardRef,
  type ButtonHTMLAttributes,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "heat";
export type ButtonSize = "sm" | "md" | "lg";

// Chunky "drop edge" buttons: a hard offset shadow instead of a blur, and a
// press interaction that sinks the button flush into it — translateY by
// exactly the shadow's depth while the shadow itself collapses to 0, so it
// reads as physically pushed in rather than just dimmed.
const buttonVariants = cva(
  [
    "button-motion group/button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[20px] text-sm font-bold",
    "transition-[transform,box-shadow,background,color,opacity] duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-45 cursor-pointer select-none border-0",
    "will-change-transform",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-ink shadow-[0_5px_0_var(--brand-shadow)] hover:bg-brand-2 active:translate-y-[5px] active:shadow-[0_0_0_var(--brand-shadow)]",
        secondary:
          "bg-surface-2 text-foreground shadow-[0_5px_0_var(--bg)] hover:bg-surface-3 active:translate-y-[5px] active:shadow-[0_0_0_var(--bg)]",
        ghost:
          "bg-transparent text-foreground hover:bg-card-hover hover:text-brand",
        danger:
          "bg-heat text-heat-ink shadow-[0_5px_0_var(--heat-shadow)] hover:brightness-105 active:translate-y-[5px] active:shadow-[0_0_0_var(--heat-shadow)]",
        heat:
          "bg-heat text-heat-ink shadow-[0_5px_0_var(--heat-shadow)] hover:brightness-105 active:translate-y-[5px] active:shadow-[0_0_0_var(--heat-shadow)]",
        cream:
          "bg-cream text-ink shadow-[0_5px_0_var(--cream-shadow)] hover:brightness-95 active:translate-y-[5px] active:shadow-[0_0_0_var(--cream-shadow)]",
      },
      size: {
        sm: "h-10 rounded-2xl px-4 text-[13px]",
        md: "h-12 px-5",
        lg: "h-14 px-7 text-[16px] sm:h-[58px] sm:px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  /** Merge styles into a single child (e.g. Next.js `Link`) instead of rendering `<button>`. */
  asChild?: boolean;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 shrink-0 animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      type = "button",
      asChild = false,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || isLoading;
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild) {
      return (
        <Slot
          ref={ref}
          aria-disabled={isDisabled ? true : undefined}
          className={cn(classes, isDisabled && "pointer-events-none opacity-45")}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={classes}
        {...props}
      >
        {isLoading && <Spinner />}
        {children}
      </button>
    );
  },
);
