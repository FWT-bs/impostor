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
          "w-full rounded-2xl border-0 bg-surface-2 px-4 py-2.5 text-sm font-bold text-foreground",
          "placeholder:text-muted",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-brand/60 focus:ring-offset-2 focus:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "ring-2 ring-heat focus:ring-heat",
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
