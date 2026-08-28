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

const SPREAD_DEG = 26; // rotation (deg) of the outermost visible card
const OVERLAP = 0.32; // 0..1 — how much neighbouring cards overlap
const ARC_Y = 9; // px each step away from centre drops
const ACTIVE_LIFT = 28; // px the centre card rises
const ACTIVE_SCALE = 1.07;
const INACTIVE_SCALE = 0.97;
const TILT_X = 8; // deg the fan leans back

export function CardFan({
  cards,
  className,
}: {
  cards: FanCard[];
  className?: string;
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

  const cardW = compact ? 118 : 178;
  const cardH = compact ? 158 : 222;
  const center = Math.floor(cards.length / 2);
  const maxVisible = compact ? 2 : 3; // cards further out than this are hidden
  const stepDeg = SPREAD_DEG / Math.max(1, maxVisible);
  const spacing = Math.round(cardW * (1 - OVERLAP));

  return (
    <div
      className={cn("relative mx-auto flex justify-center", className)}
      style={{ height: cardH + 66, perspective: 1100 }}
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
