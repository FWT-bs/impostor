"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useId, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id: idProp, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = idProp ?? props.name ?? autoId;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <div className="w-full space-y-1.5">
      {label != null && label !== "" && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-foreground"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-xl border-2 border-border bg-card px-4 py-2.5 text-sm text-foreground",
          "placeholder:text-muted",
          "transition-all duration-200",
          "focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/30 focus:ring-offset-2 focus:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error &&
            "border-rose focus:border-rose focus:ring-rose/30",
          className,
        )}
        {...props}
      />
      {error != null && error !== "" && (
        <p id={errorId} className="text-sm text-rose" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
