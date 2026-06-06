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

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "heat";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Merge styles into a single child (e.g. Next.js `Link`) instead of rendering `<button>`. */
  asChild?: boolean;
}

/* Maps onto the "Live" design-system .btn-* classes in globals.css. */
const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-ghost",
  danger: "btn-heat",
  heat: "btn-heat",
  ghost: "btn-line",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return cn(
    "btn",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    variantClasses[variant],
    sizeClasses[size],
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
          isDisabled && "pointer-events-none opacity-45",
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
