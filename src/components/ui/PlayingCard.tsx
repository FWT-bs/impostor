"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { type CSSProperties, type ReactNode } from "react";

/**
 * One physical-feeling game card, used both in the hero fan and in the game
 * itself. All internal sizing is in container-query units (`cqw`), so a single
 * component scales cleanly from a 110px fan card to a 340px reveal card — the
 * caller only sets width/height on the outer element.
 *
 * Texture comes from four stacked layers on the face: fractal-noise grain, a
 * diagonal sheen, an inset bevel, and a faint watermark glyph.
 */

// Tileable greyscale fractal noise, inlined so there's no network request.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")";

export type PlayingCardVariant = "crew" | "impostor" | "neutral" | "back";

export interface PlayingCardProps {
  variant: PlayingCardVariant;
  /** Small label across the top of the card. */
  category?: string;
  /** The big word — crew only unless `headline` is set. */
  word?: string;
  /** Extra line under the headline, e.g. "romance". */
  hint?: string;
  /** Replaces the default big text ("IMPOSTOR" / `word`). */
  headline?: string;
  /** "top" keeps the word in the upper third (survives a fanned card's
   *  overlap); "center" vertically centres it — better for a single big card. */
  align?: "top" | "center";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const WATERMARK: Record<Exclude<PlayingCardVariant, "back">, IconName> = {
  crew: "eye",
  impostor: "ghost",
  neutral: "chat",
};

export function PlayingCard({
  variant,
  category,
  word,
  hint,
  headline,
  align = "top",
  className,
  style,
  children,
}: PlayingCardProps) {
  const impostor = variant === "impostor";
  const back = variant === "back";
  const neutral = variant === "neutral";

  return (
    <div
      className={cn("relative isolate", className)}
      style={{ containerType: "inline-size", ...style }}
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[7cqw]",
          back
            ? "bg-[#17311f] text-brand"
            : impostor
              ? "bg-heat text-heat-ink"
              : neutral
                ? "bg-surface-2 text-foreground"
                : "bg-brand text-brand-ink",
        )}
        style={{
          boxShadow:
            "inset 0 0.7cqw 0 rgba(255,255,255,0.30), inset 0 -9cqw 13cqw rgba(0,0,0,0.24), 0 1.6cqw 0 rgba(0,0,0,0.20), 0 3.4cqw 0 rgba(0,0,0,0.12), 0 12cqw 24cqw -6cqw rgba(0,0,0,0.6)",
        }}
      >
        {/* grain */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ backgroundImage: GRAIN, backgroundSize: "38cqw", opacity: back ? 0.22 : 0.16 }}
        />
        {/* diagonal sheen */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(122deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.05) 32%, rgba(255,255,255,0) 52%, rgba(0,0,0,0.16) 100%)",
          }}
        />
        {/* inset frame */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-[4.5cqw]"
          style={{ inset: "4.5cqw", border: "0.4cqw solid rgba(255,255,255,0.22)" }}
        />

        {back ? (
          <BackFace />
        ) : (
          <>
            {/* watermark glyph, low in the card so it reads as texture, not
                a target behind the word */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ top: "72%", opacity: 0.08 }}
            >
              <span className="block" style={{ width: "56cqw", height: "56cqw" }}>
                <Icon
                  name={WATERMARK[neutral ? "neutral" : impostor ? "impostor" : "crew"]}
                  className="h-full w-full"
                  stroke={1.4}
                />
              </span>
            </span>

            <div className="relative z-[1] flex h-full w-full flex-col p-[7.5cqw] text-left">
              <span
                className="font-extrabold uppercase tracking-[0.16em]"
                style={{ fontSize: "5.2cqw", opacity: 0.6 }}
              >
                {category}
              </span>
              <span
                aria-hidden
                className="mt-[3cqw] block rounded-full bg-current"
                style={{ height: "1cqw", width: "9cqw", opacity: 0.3 }}
              />

              <div
                className={cn(
                  align === "center" ? "flex flex-1 flex-col justify-center pb-[6cqw]" : "mt-[9cqw]",
                )}
              >
                <strong
                  className="display block uppercase"
                  style={{ fontSize: "14.5cqw", lineHeight: 0.98 }}
                >
                  {headline ?? (impostor ? "IMPOSTOR" : word)}
                </strong>
                {hint ? (
                  <span
                    className="mt-[3cqw] block font-semibold lowercase"
                    style={{ fontSize: "6cqw", opacity: 0.72 }}
                  >
                    hint: {hint}
                  </span>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
      {children}
    </div>
  );
}

function BackFace() {
  return (
    <div className="relative z-[1] grid h-full w-full place-items-center">
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(135deg, rgba(53,216,121,0.22) 0 2.4cqw, transparent 2.4cqw 8cqw)",
        }}
      />
      <span
        aria-hidden
        className="absolute rounded-[4.5cqw]"
        style={{ inset: "8cqw", border: "0.5cqw solid rgba(53,216,121,0.45)" }}
      />
      <span
        className="relative grid place-items-center rounded-full"
        style={{
          width: "32cqw",
          height: "32cqw",
          border: "0.8cqw solid rgba(53,216,121,0.7)",
          background: "rgba(53,216,121,0.16)",
        }}
      >
        <span className="block" style={{ width: "16cqw", height: "16cqw" }}>
          <Icon name="eye" className="h-full w-full text-brand" stroke={1.8} />
        </span>
      </span>
    </div>
  );
}
