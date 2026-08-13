"use client";

import Image from "next/image";

export interface LogoProps {
  size?: number;
  showWord?: boolean;
  word?: string;
  className?: string;
  premium?: boolean;
}

/** Brand mark + condensed wordmark for the case-file table theme. */
export function Logo({
  size = 30,
  showWord = true,
  word = "IMPOSTER",
  className,
  premium = false,
}: LogoProps) {
  const logoSrc = premium
    ? "/assets/imposter-premium-logo.png"
    : "/assets/imposter-basic-logo.png";
  const imageScale = premium ? 1.22 : 1.32;

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span
        className="relative overflow-hidden"
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(8, size * 0.32),
          background: "#000",
        }}
      >
        <Image
          src={logoSrc}
          alt=""
          fill
          sizes={`${size}px`}
          priority={size >= 28}
          className="object-contain"
          style={{
            transform: `scale(${imageScale})`,
          }}
        />
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
