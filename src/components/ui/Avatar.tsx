"use client";

import { cn, getInitials } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { type HTMLAttributes } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type PlayerRole = "impostor" | "crew";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  color: string;
  size?: AvatarSize;
  imageUrl?: string | null;
  /** Show a role badge in the corner (mask = impostor, shield = crew). */
  role?: PlayerRole;
  /** Outline the token to mark "you". */
  you?: boolean;
  /** Dim un-joined / inactive players. */
  dim?: boolean;
}

const sizeClass: Record<AvatarSize, string> = {
  xs: "token-xs",
  sm: "token-sm",
  md: "token-md",
  lg: "token-lg",
  xl: "token-xl",
};

const badgeIconSize: Record<AvatarSize, number> = {
  xs: 9,
  sm: 10,
  md: 11,
  lg: 13,
  xl: 16,
};

/**
 * Geometric player token with initials, an optional role badge, and an
 * optional "you" outline. Keeps the original Avatar prop surface.
 */
export function Avatar({
  name,
  color,
  size = "md",
  imageUrl,
  role,
  you = false,
  dim = false,
  className,
  style,
  ...props
}: AvatarProps) {
  const label = name.trim() || "Player";
  const initials = getInitials(label) || "?";

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("token", sizeClass[size], className)}
      style={{
        background: color,
        opacity: dim ? 0.45 : 1,
        outline: you ? "2px solid var(--text)" : "none",
        outlineOffset: 2,
        overflow: imageUrl ? "hidden" : undefined,
        ...style,
      }}
      {...props}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className="h-full w-full object-cover"
          style={{ borderRadius: "inherit" }}
          draggable={false}
        />
      ) : (
        <span
          style={{
            position: "relative",
            zIndex: 1,
            textShadow: "0 1px 2px rgba(0,0,0,.4)",
          }}
        >
          {initials}
        </span>
      )}
      {role && (
        <span
          className="token-badge"
          style={{ color: role === "impostor" ? "var(--heat)" : "var(--aqua)" }}
        >
          <Icon
            name={role === "impostor" ? "mask" : "shield"}
            size={badgeIconSize[size]}
            stroke={2}
          />
        </span>
      )}
    </div>
  );
}
