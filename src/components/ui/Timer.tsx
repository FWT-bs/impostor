"use client";

import { cn, formatTimerSeconds } from "@/lib/utils";
import { useMemo } from "react";

export interface TimerProps {
  seconds: number;
  total: number;
  className?: string;
  /** SVG viewBox size; ring scales with this */
  size?: number;
}

function ringColor(percentRemaining: number): string {
  if (percentRemaining > 50) return "var(--teal)";
  if (percentRemaining > 25) return "var(--amber)";
  return "var(--danger)";
}

export function Timer({
  seconds,
  total,
  className,
  size = 120,
}: TimerProps) {
  const safeTotal = total > 0 ? total : 1;
  const clampedSeconds = Math.max(0, Math.min(seconds, safeTotal));
  const percentRemaining = (clampedSeconds / safeTotal) * 100;

  const { radius, strokeWidth, circumference, offset } = useMemo(() => {
    const strokeWidth = Math.max(4, Math.round(size * 0.06));
    const radius = size / 2 - strokeWidth / 2 - 2;
    const circumference = 2 * Math.PI * radius;
    const progress = clampedSeconds / safeTotal;
    const offset = circumference * (1 - progress);
    return { radius, strokeWidth, circumference, offset };
  }, [size, clampedSeconds, safeTotal]);

  const stroke = ringColor(percentRemaining);
  const pulse = clampedSeconds > 0 && clampedSeconds < 10;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        pulse && "animate-pulse",
        className,
      )}
      style={{ width: size, height: size }}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatTimerSeconds(Math.ceil(clampedSeconds))}`}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke,stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span
        className={cn(
          "absolute font-heading text-lg font-bold tabular-nums tracking-wide sm:text-xl",
          percentRemaining > 50 && "text-teal",
          percentRemaining > 25 && percentRemaining <= 50 && "text-amber",
          percentRemaining <= 25 && "text-danger",
        )}
      >
        {formatTimerSeconds(Math.ceil(clampedSeconds))}
      </span>
    </div>
  );
}
