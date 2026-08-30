"use client";

import { PlayingCard } from "@/components/ui/PlayingCard";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * A fanned "hand" of cards. Each card gets a signed offset from the centre, and
 * rotate / x / y / scale are derived from it; the centre card is emphasised. The
 * whole fan sits on a shallow 3D plane so the cards read as physical objects
 * rather than flat rectangles.
 *
 * The resting layout is plain CSS `transform`, so it's correct even if JS
 * animation is throttled. Framer Motion only layers a deal-in and a hover lift.
 */

export type FanCard = {
  id: string;
  category: string;
  word?: string;
  hint?: string;
  impostor?: boolean;
};

/**
 * Fan geometry. Desktop runs a much flatter arc than a real hand of cards would:
 * the cards read as a row of dealt hands laid across the table, so each face
 * stays upright and legible instead of tipping onto its corner.
 */
const DESKTOP = {
  spreadDeg: 19, // rotation (deg) of the outermost visible card
  overlap: 0.28, // 0..1 — how much neighbouring cards overlap
  arcY: 15, // px each step away from centre drops
  cardH: 310,
  aspect: 0.8, // width / height
  maxVisible: 4, // cards either side of centre
  minH: 268,
  maxH: 400,
};

const COMPACT = {
  spreadDeg: 24,
  overlap: 0.4,
  arcY: 20,
  cardH: 196,
  aspect: 0.745,
  maxVisible: 2,
  minH: 180,
  maxH: 280,
};

const ACTIVE_LIFT = 28; // px the centre card rises
const ACTIVE_SCALE = 1.08;
const INACTIVE_SCALE = 0.96;
const TILT_X = 6; // deg the fan leans back
const HEAD_PAD = ACTIVE_LIFT + 18; // clearance above the lifted centre card
// Where the centre card's bottom edge lands relative to the fold. Negative
// leaves a sliver of the card showing above it — enough to read as "there's
// more here" without the flat bottom edge sitting in full view.
const FOLD_OFFSET = -26;

export function CardFan({
  cards,
  className,
  bleed = false,
  fitBelowFold = false,
}: {
  cards: FanCard[];
  className?: string;
  /**
   * Let the outer cards run past the page container and get cropped by the
   * viewport, so the hand reads as bigger than the screen rather than as a
   * tidy, fully-contained graphic.
   */
  bleed?: boolean;
  /**
   * Size the cards so their bottom edges land just past the bottom of the
   * screen. The hand then reads as a table that carries on below the fold
   * instead of a graphic parked on black — and because the height is derived
   * from where the fan actually sits, it survives a wrapped headline or any
   * viewport without a hand-tuned margin.
   */
  fitBelowFold?: boolean;
}) {
  const reduce = useReducedMotion();
  const [compact, setCompact] = useState(false);
  const [fit, setFit] = useState<{ h: number; push: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const g = compact ? COMPACT : DESKTOP;

  useEffect(() => {
    if (!fitBelowFold) return;
    const el = boxRef.current;
    if (!el) return;

    const measure = () => {
      // The box's own top is fixed by the content above it — neither a taller
      // card nor the drop below moves it — so a single pass solves this with no
      // risk of each measurement chasing the last.
      const top = el.getBoundingClientRect().top + window.scrollY;
      // The centre card's bottom sits at `top + (HEAD_PAD - ACTIVE_LIFT) +
      // cardH * ACTIVE_SCALE`, and we want that landing at the fold + offset.
      const room = window.innerHeight + FOLD_OFFSET - top - (HEAD_PAD - ACTIVE_LIFT);
      const h = Math.round(Math.min(g.maxH, Math.max(g.minH, room / ACTIVE_SCALE)));
      // On a tall screen the cards would have to be enormous to reach the fold
      // on their own, so past the cap the rest of the distance is made up by
      // dropping the whole hand instead.
      const push = Math.max(0, Math.round(room - h * ACTIVE_SCALE));
      setFit({ h, push });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fitBelowFold, g]);

  const { maxVisible, arcY: ARC_Y, spreadDeg: SPREAD_DEG } = g;
  // Falls back to the fixed height until (or unless) the fit runs, so a
  // throttled or failed measure still renders a complete, visible hand.
  const cardH = fitBelowFold && fit ? fit.h : g.cardH;
  const cardW = Math.round(cardH * g.aspect);
  const center = Math.floor(cards.length / 2);
  const stepDeg = SPREAD_DEG / Math.max(1, maxVisible);
  const spacing = Math.round(cardW * (1 - g.overlap));

  // Clearance the centre card needs above its resting top: it is both lifted
  // and scaled from its bottom edge, so it grows upward on both counts.
  const headRoom = HEAD_PAD + Math.round(cardH * (ACTIVE_SCALE - 1));

  // Room the outer cards need below their anchor: they are pushed down the arc,
  // and rotating about the bottom centre swings a corner lower still. The box
  // holds the whole hand — nothing is cut off horizontally through the cards.
  const footRoom =
    ARC_Y * maxVisible +
    Math.round((cardW / 2) * Math.sin((SPREAD_DEG * Math.PI) / 180)) +
    12;

  return (
    <div
      ref={boxRef}
      className={cn(
        "relative mx-auto flex justify-center",
        // Only the horizontal axis is clipped, and only to stop a card that
        // runs past the viewport edge from adding a scrollbar. Clipping
        // vertically would slice a hard line through the cards, which reads as
        // a rendering mistake rather than artwork running off the screen.
        bleed && "w-screen max-w-none overflow-x-clip left-1/2 -translate-x-1/2",
        className,
      )}
      style={{
        // The cards hang off the box's bottom edge, so growing the box drops
        // the whole hand without touching where the box itself starts — which
        // keeps the measurement above stable.
        height: (bleed ? cardH + headRoom + footRoom : cardH + 40) + (fit?.push ?? 0),
        perspective: 1200,
      }}
    >
      <div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d", transform: `rotateX(${TILT_X}deg)` }}
      >
        {cards.map((card, index) => {
          const offset = index - center;
          const abs = Math.abs(offset);
          if (abs > maxVisible) return null;

          const active = offset === 0;
          const restY = abs * ARC_Y + (active ? -ACTIVE_LIFT : 0);
          const rotate = offset * stepDeg;
          const scale = active ? ACTIVE_SCALE : INACTIVE_SCALE;

          return (
            <div
              key={card.id}
              className="absolute origin-bottom"
              style={{
                width: cardW,
                height: cardH,
                left: "50%",
                // Anchored above the foot room so the arc's lowest card still
                // lands inside the box.
                bottom: bleed ? footRoom : 0,
                marginLeft: -cardW / 2,
                zIndex: 20 - abs,
                transform: `translateX(${offset * spacing}px) translateY(${restY}px) rotate(${rotate}deg) scale(${scale})`,
              }}
            >
              <motion.div
                className="h-full w-full origin-bottom will-change-transform"
                initial={reduce ? false : { y: 46, scale: 0.92 }}
                animate={{ y: 0, scale: 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 200,
                        damping: 24,
                        delay: 0.04 + abs * 0.06,
                      }
                }
                whileHover={
                  reduce
                    ? undefined
                    : {
                        y: -18,
                        transition: { type: "spring", stiffness: 320, damping: 22 },
                      }
                }
              >
                <PlayingCard
                  variant={card.impostor ? "impostor" : "crew"}
                  category={card.category}
                  word={card.word}
                  hint={card.hint}
                  className="h-full w-full"
                />
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
