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
        "rounded-2xl text-foreground",
        paddingClasses[padding],
        hover &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]",
        glow && "animate-glow-pulse",
        className,
      )}
      style={{
        background: "rgba(14,16,36,0.75)",
        border: `1px solid ${glow ? "rgba(128,112,212,0.3)" : "rgba(28,31,58,1)"}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        ...(hover
          ? {
              ["--card-hover-border" as string]: "rgba(128,112,212,0.2)",
            }
          : {}),
        ...style,
      }}
      {...props}
    />
  );
}
