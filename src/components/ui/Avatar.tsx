"use client";

import { cn, getInitials } from "@/lib/utils";
import { type HTMLAttributes } from "react";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  color: string;
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
};

export function Avatar({
  name,
  color,
  size = "md",
  className,
  style,
  ...props
}: AvatarProps) {
  const initials = getInitials(name.trim() || "?");

  return (
    <div
      role="img"
      aria-label={name.trim() || "Player"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-heading font-bold uppercase tracking-wide text-white shadow-inner ring-2 ring-black/20",
        sizeClasses[size],
        className,
      )}
      style={{
        backgroundColor: color,
        ...style,
      }}
      {...props}
    >
      {initials || "?"}
    </div>
  );
}
