"use client";

import { Icon } from "@/components/ui/Icon";

export interface LogoProps {
  size?: number;
  showWord?: boolean;
  word?: string;
  className?: string;
}

/** Mask glyph + condensed wordmark for the case-file table theme. */
export function Logo({ size = 30, showWord = true, word = "IMPOSTER", className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
          background: "var(--navy)",
          color: "#fff",
        }}
      >
        <Icon name="mask" size={size * 0.62} stroke={1.7} />
      </span>
      {showWord && (
        <span
          className="display"
          style={{ fontSize: size * 0.86, color: "var(--text)", letterSpacing: 0 }}
        >
          {word}
        </span>
      )}
    </span>
  );
}
