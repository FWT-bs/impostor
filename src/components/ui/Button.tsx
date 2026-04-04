"use client";

import { cn } from "@/lib/utils";
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Merge styles into a single child (e.g. Next.js `Link`) instead of rendering `<button>`. */
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-teal text-background font-semibold shadow-[0_0_0_1px_rgba(0,240,255,0.2)] hover:shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:bg-teal-dim active:scale-[0.98] disabled:shadow-none disabled:hover:shadow-none",
  secondary:
    "bg-card border border-border text-foreground hover:bg-card-hover hover:border-teal/30 active:scale-[0.98]",
  danger:
    "bg-danger text-white font-semibold hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] active:scale-[0.98]",
  ghost:
    "bg-transparent text-foreground hover:bg-card/80 hover:text-teal active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    size === "sm" && variant === "ghost" && "h-8 px-2",
    size === "md" && variant === "ghost" && "h-10 px-3",
    size === "lg" && variant === "ghost" && "h-12 px-4",
    variant !== "ghost" ? sizeClasses[size] : "",
    className,
  );
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
    const classes = buttonClassName(variant, size, className);

    if (asChild) {
      const child = Children.only(children);
      if (!isValidElement(child)) {
        throw new Error("Button with `asChild` expects a single React element child.");
      }
      const el = child as ReactElement<{
        className?: string;
        children?: React.ReactNode;
        tabIndex?: number;
      }>;
      return cloneElement(el, {
        className: cn(
          classes,
          el.props.className,
          isDisabled && "pointer-events-none opacity-50",
        ),
        "aria-disabled": isDisabled ? true : undefined,
        tabIndex: isDisabled ? -1 : el.props.tabIndex,
        ref: ref as never,
        children: (
          <>
            {isLoading && (
              <Spinner
                className={variant === "primary" ? "text-background" : undefined}
              />
            )}
            {el.props.children}
          </>
        ),
      } as never);
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
            className={variant === "primary" ? "text-background" : undefined}
          />
        )}
        {children}
      </button>
    );
  },
);
