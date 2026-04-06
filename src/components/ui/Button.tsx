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
    "bg-gradient-to-r from-purple to-purple-dim text-white font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(124,108,206,0.3)] hover:brightness-110 active:scale-[0.97] disabled:shadow-none disabled:hover:shadow-none",
  secondary:
    "bg-card border border-border text-foreground font-medium hover:bg-card-hover hover:border-purple/30 hover:shadow-[0_2px_12px_rgba(124,108,206,0.1)] active:scale-[0.97]",
  danger:
    "bg-gradient-to-r from-rose to-rose/80 text-white font-semibold hover:shadow-[0_4px_16px_rgba(192,86,106,0.3)] hover:brightness-110 active:scale-[0.97]",
  ghost:
    "bg-transparent text-foreground hover:bg-card/80 hover:text-purple active:scale-[0.97]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-5 text-sm rounded-full gap-2",
  md: "h-11 px-6 text-sm rounded-full gap-2",
  lg: "h-13 px-8 text-base rounded-full gap-2.5",
};

function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center font-medium cursor-pointer",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    size === "sm" && variant === "ghost" && "h-9 px-3 rounded-full",
    size === "md" && variant === "ghost" && "h-11 px-4 rounded-full",
    size === "lg" && variant === "ghost" && "h-13 px-6 rounded-full",
    variant !== "ghost" ? sizeClasses[size] : sizeClasses[size],
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
                className={variant === "primary" ? "text-white" : undefined}
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
            className={variant === "primary" ? "text-white" : undefined}
          />
        )}
        {children}
      </button>
    );
  },
);
