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
        "rounded-2xl border border-border bg-card/80 backdrop-blur-sm text-foreground",
        paddingClasses[padding],
        hover &&
          "transition-all duration-300 hover:border-purple/30 hover:bg-card-hover hover:shadow-[0_8px_32px_rgba(168,85,247,0.12)] hover:-translate-y-0.5",
        glow && "animate-glow-pulse border-purple/40",
        className,
      )}
      {...props}
    />
  );
}
