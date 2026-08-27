"use client";

import { ADSENSE_CLIENT } from "@/lib/ads";
import { cn } from "@/lib/utils";
import { useEffect, useRef, type CSSProperties } from "react";

export interface AdUnitProps {
  /** The ad unit's slot ID from the AdSense dashboard (Ads → By ad unit). */
  slot: string;
  /** `"auto"` for a responsive unit, or a fixed format like `"rectangle"`. */
  format?: string;
  /** Let AdSense pick the size for the container width. */
  responsive?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * One AdSense display unit. The site-wide loader lives in `app/layout.tsx`;
 * this just drops an `<ins>` and asks AdSense to fill it once on mount.
 *
 * Ads only render on the deployed domain once the site is approved and
 * `/ads.txt` is live — locally you'll see an empty box, which is expected.
 */
export function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className,
  style,
}: AdUnitProps) {
  const filled = useRef(false);

  useEffect(() => {
    if (filled.current) return;
    filled.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn("adsbygoogle push failed:", error);
    }
  }, []);

  return (
    <ins
      className={cn("adsbygoogle block", className)}
      style={{ display: "block", ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
