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

const buttonVariants = cva(
  [
    "button-motion group/button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-extrabold",
    "transition-[transform,box-shadow,border-color,background,color,opacity] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-45 cursor-pointer select-none",
    "will-change-transform hover:scale-[1.01] active:translate-y-px active:scale-[0.985]",
  ],
  {
    variants: {
      variant: {
        primary:
          "border border-brand bg-brand text-[var(--brand-ink)] shadow-[0_12px_24px_rgba(24,185,100,0.22)] hover:-translate-y-0.5 hover:bg-brand-2 hover:shadow-[0_16px_30px_rgba(24,185,100,0.26)]",
        secondary:
          "border border-border bg-card/90 text-foreground shadow-[0_10px_20px_rgba(7,22,42,0.08)] hover:-translate-y-0.5 hover:border-brand/50 hover:bg-card-hover",
        ghost:
          "border border-transparent bg-transparent text-foreground hover:bg-card-hover hover:text-brand",
        danger:
          "border border-heat bg-heat text-white shadow-[0_12px_24px_rgba(238,77,63,0.18)] hover:-translate-y-0.5 hover:bg-heat-2",
        heat:
          "border border-heat bg-heat text-white shadow-[0_12px_24px_rgba(238,77,63,0.18)] hover:-translate-y-0.5 hover:bg-heat-2",
      },
      size: {
        sm: "h-10 rounded-xl px-4 text-[13px]",
        md: "h-12 px-5",
        lg: "h-14 rounded-xl px-7 text-[16px] sm:h-[58px] sm:px-8",
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
        {isLoading && (
          <Spinner
            className={variant === "primary" ? "text-white" : undefined}
          />
        )}
        {children}
      </button>
    );
  },
);
