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
  style,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "lava-card rounded-[18px] border border-border bg-card/92 text-foreground shadow-[0_18px_40px_rgba(7,22,42,0.08)]",
        paddingClasses[padding],
        hover &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/42 hover:bg-card-hover",
        glow && "border-brand/40",
        className,
      )}
      style={style}
      {...props}
    />
  );
}
