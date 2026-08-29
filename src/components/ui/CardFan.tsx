"use client";

import { PlayingCard } from "@/components/ui/PlayingCard";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

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
  cardW: 248,
  cardH: 310,
  maxVisible: 4, // cards either side of centre
};

const COMPACT = {
  spreadDeg: 24,
  overlap: 0.4,
  arcY: 20,
  cardW: 146,
  cardH: 196,
  maxVisible: 2,
};

const ACTIVE_LIFT = 28; // px the centre card rises
const ACTIVE_SCALE = 1.08;
const INACTIVE_SCALE = 0.96;
const TILT_X = 6; // deg the fan leans back

export function CardFan({
  cards,
  className,
  bleed = false,
}: {
  cards: FanCard[];
  className?: string;
  /**
   * Let the outer cards run past the page container and get cropped by the
   * viewport, so the hand reads as bigger than the screen rather than as a
   * tidy, fully-contained graphic.
   */
  bleed?: boolean;
}) {
  const reduce = useReducedMotion();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const g = compact ? COMPACT : DESKTOP;
  const { cardW, cardH, maxVisible, arcY: ARC_Y, spreadDeg: SPREAD_DEG } = g;
  const center = Math.floor(cards.length / 2);
  const stepDeg = SPREAD_DEG / Math.max(1, maxVisible);
  const spacing = Math.round(cardW * (1 - g.overlap));

  // Clearance the centre card needs above its resting top: it is both lifted
  // and scaled from its bottom edge, so it grows upward on both counts.
  const headRoom = ACTIVE_LIFT + Math.round(cardH * (ACTIVE_SCALE - 1)) + 18;

  // Room the outer cards need below their anchor: they are pushed down the arc,
  // and rotating about the bottom centre swings a corner lower still. The box
  // holds the whole hand — nothing is cut off horizontally through the cards.
  const footRoom =
    ARC_Y * maxVisible +
    Math.round((cardW / 2) * Math.sin((SPREAD_DEG * Math.PI) / 180)) +
    12;

  return (
    <div
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
        height: bleed ? cardH + headRoom + footRoom : cardH + 40,
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
