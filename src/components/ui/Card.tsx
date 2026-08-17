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
        // Cards are told apart by surface color, not borders or blurred
        // shadows — matches the flat elevated-tile system.
        "rounded-[28px] bg-card text-foreground",
        paddingClasses[padding],
        hover &&
          "cursor-pointer transition-all duration-200 will-change-transform hover:-translate-y-0.5 hover:bg-card-hover active:translate-y-0 active:scale-[0.985] active:duration-100",
        glow && "ring-2 ring-brand/45",
        className,
      )}
      style={style}
      {...props}
    />
  );
}
