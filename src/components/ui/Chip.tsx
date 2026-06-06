"use client";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { type HTMLAttributes } from "react";

export type ChipTone = "default" | "live" | "heat" | "aqua" | "brand";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  icon?: IconName;
  iconFill?: boolean;
}

const toneClass: Record<ChipTone, string> = {
  default: "",
  live: "chip-live",
  heat: "chip-heat",
  aqua: "chip-aqua",
  brand: "chip-brand",
};

export function Chip({
  tone = "default",
  icon,
  iconFill,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span className={cn("chip", toneClass[tone], className)} {...props}>
      {icon && <Icon name={icon} size={12} stroke={2} fill={iconFill} />}
      {children}
    </span>
  );
}
