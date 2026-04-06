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
          "transition-all duration-300 hover:border-purple/20 hover:bg-card-hover hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:-translate-y-0.5",
        glow && "animate-glow-pulse border-purple/30",
        className,
      )}
      {...props}
    />
  );
}
