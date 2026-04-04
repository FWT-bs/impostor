"use client";

import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
  padding?: CardPadding;
}

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-6 sm:p-8",
};

export function Card({
  className,
  hover = false,
  glow = false,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-foreground",
        paddingClasses[padding],
        hover &&
          "transition-colors duration-200 hover:border-teal/25 hover:bg-card-hover",
        glow && "animate-glow-pulse border-teal/40",
        className,
      )}
      {...props}
    />
  );
}
