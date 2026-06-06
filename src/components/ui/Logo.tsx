"use client";

import { Icon } from "@/components/ui/Icon";

export interface LogoProps {
  size?: number;
  showWord?: boolean;
  word?: string;
  className?: string;
}

/** Mask glyph + condensed wordmark — replaces the old ghost mascot. */
export function Logo({ size = 30, showWord = true, word = "IMPOSTER", className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(140deg, var(--brand), color-mix(in oklab, var(--heat) 55%, var(--brand)))",
          boxShadow: "0 4px 16px -6px var(--brand)",
          color: "#fff",
        }}
      >
        <Icon name="mask" size={size * 0.62} stroke={1.7} />
      </span>
      {showWord && (
        <span
          className="display"
          style={{ fontSize: size * 0.74, color: "var(--text)", letterSpacing: "0.04em" }}
        >
          {word}
        </span>
      )}
    </span>
  );
}
