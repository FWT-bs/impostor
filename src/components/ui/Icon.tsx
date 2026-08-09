"use client";

import { type CSSProperties } from "react";

/* Inline icon set with crisp geometric controls. */
export const ICONS = {
  mask: "M3 5c3 0 5 1 9 1s6-1 9-1c0 6-1.5 12-9 12S3 11 3 5Zm5 5.5h.01M16 10.5h.01M9.5 14c1.5 1.2 3.5 1.2 5 0",
  shield: "M12 3l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3Zm-3 8.5l2 2 4-4",
  users: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 8v-1.5a3.5 3.5 0 0 0-2.6-3.4M15 5.2a3 3 0 0 1 0 5.6",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18c2.5 2.2 3.5 5.5 3.5 9s-1 6.8-3.5 9c-2.5-2.2-3.5-5.5-3.5-9s1-6.8 3.5-9ZM3.5 9h17M3.5 15h17",
  lock: "M6 10V8a6 6 0 0 1 12 0v2m-13 0h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm7 4v2",
  bolt: "M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8Z",
  send: "M4 12l16-8-6 16-2.5-6.5L4 12Z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chev: "M9 6l6 6-6 6",
  trophy: "M7 4h10v3a5 5 0 0 1-10 0V4ZM5 5H3v1a3 3 0 0 0 3 3M19 5h2v1a3 3 0 0 1-3 3M9 14h6m-3 0v3m-3 3h6",
  chair: "M8 4v7h8V4M7 11h10a2 2 0 0 1 2 2v3H5v-3a2 2 0 0 1 2-2Zm0 5v4M17 16v4M9 8h6",
  crown: "M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 9h-13L4 8Zm1.5 13h13",
  copy: "M9 9h10v10H9zM5 15H4V5a1 1 0 0 1 1-1h10v1",
  play: "M7 5l11 7-11 7V5Z",
  dice: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3.5 4.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  flame: "M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.5C9 10 9.5 11 11 11c.8-2.2-1-3.5 1-8Z",
  check: "M5 12.5l4.5 4.5L19 7",
  x: "M6 6l12 12M18 6 6 18",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2",
  chat: "M21 12a8 8 0 0 1-11.4 7.2L4 21l1.8-5.6A8 8 0 1 1 21 12Z",
  star: "M12 3l2.6 5.6L20.5 9.4l-4.3 4 1.1 6L12 16.6 6.7 19.4l1.1-6-4.3-4 5.9-.8L12 3Z",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  vote: "M5 13l4 4L19 7M4 20h16",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  ghost: "M5 21V11a7 7 0 0 1 14 0v10l-2.3-1.8L14.4 21 12 19.2 9.6 21l-2.3-1.8L5 21Zm4-11h.01M15 10h.01",
  logout: "M15 12H3m9-4-4 4 4 4M9 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9",
  trash: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M21 12a9 9 0 0 1-15 6.7L3 16m0 4v-4h4",
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Icon({
  name,
  size = 20,
  stroke = 1.8,
  fill = false,
  className,
  style,
}: IconProps) {
  const d = ICONS[name] ?? "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
