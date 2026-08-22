"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  id?: string;
  /** Shows a live "n / max" counter under the field when set. */
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, id: idProp, maxLength, value, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = idProp ?? props.name ?? autoId;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : undefined;
  const length = typeof value === "string" ? value.length : 0;

  return (
    <div className="w-full space-y-1.5">
      {label != null && label !== "" && (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
            {label}
          </label>
          {maxLength != null && (
            <span className={cn("text-xs text-muted", length > maxLength && "text-heat")}>
              {length}/{maxLength}
            </span>
          )}
        </div>
      )}
      <textarea
        ref={ref}
        id={inputId}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full resize-none rounded-2xl border-0 bg-surface-2 px-4 py-3 text-sm font-medium text-foreground",
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
