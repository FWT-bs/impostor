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

const SPREAD_DEG = 34; // rotation (deg) of the outermost visible card
const OVERLAP = 0.44; // 0..1 — how much neighbouring cards overlap
const ARC_Y = 34; // px each step away from centre drops
const ACTIVE_LIFT = 30; // px the centre card rises
const ACTIVE_SCALE = 1.08;
const INACTIVE_SCALE = 0.96;
const TILT_X = 8; // deg the fan leans back

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

  const cardW = compact ? 132 : 214;
  const cardH = compact ? 178 : 268;
  const center = Math.floor(cards.length / 2);
  // More cards on wide screens so the hand reaches the viewport edges and the
  // outermost ones get cropped, rather than sitting inset on the page.
  const maxVisible = compact ? 2 : 4;
  const stepDeg = SPREAD_DEG / Math.max(1, maxVisible);
  const spacing = Math.round(cardW * (1 - OVERLAP));

  // Clearance the centre card needs above its resting top: it is both lifted
  // and scaled from its bottom edge, so it grows upward on both counts. Without
  // counting the scale the overflow clip shaves off its top edge.
  const headRoom = ACTIVE_LIFT + Math.round(cardH * (ACTIVE_SCALE - 1)) + 18;

  return (
    <div
      className={cn(
        "relative mx-auto flex justify-center",
        // The fan is clipped, not scrolled — the page must never gain a
        // horizontal scrollbar because a card hangs off the edge. The height is
        // deliberately shorter than the fanned-out hand, so the outer cards run
        // off the bottom instead of sitting neatly inside a box.
        bleed && "w-screen max-w-none overflow-hidden left-1/2 -translate-x-1/2",
        className,
      )}
      style={{
        // Tall enough that the raised centre card keeps its head room, short
        // enough that the splayed outer cards run off the bottom edge.
        height: bleed ? cardH + headRoom : cardH + 40,
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
              className="absolute bottom-0 origin-bottom"
              style={{
                width: cardW,
                height: cardH,
                left: "50%",
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
