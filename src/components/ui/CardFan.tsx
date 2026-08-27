"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * A fanned "hand" of cards. The fan geometry (angle, overlap, arc, active lift)
 * follows a card-stack model: each card gets a signed offset from the centre,
 * and rotate / x / y / scale are derived from it. The centre card is emphasised.
 *
 * The resting fan layout is plain CSS `transform`, so it's always correct even
 * if JS animation is throttled. Framer Motion only layers a deal-in on mount and
 * a lift on hover.
 */

export type FanCard = {
  id: string;
  /** Small label across the top of the card. */
  category: string;
  /** Big word on the card. Ignored when `impostor` is set. */
  word?: string;
  /** Renders the card in the impostor style with "IMPOSTOR" instead of a word. */
  impostor?: boolean;
};

const SPREAD_DEG = 40; // total fan angle, edge to edge
const OVERLAP = 0.42; // 0..1 — how much neighbouring cards overlap
const ARC_Y = 10; // px each step away from centre drops
const ACTIVE_LIFT = 28; // px the centre card rises
const ACTIVE_SCALE = 1.06;
const INACTIVE_SCALE = 0.97;

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

  const cardW = compact ? 116 : 174;
  const cardH = compact ? 158 : 238;
  const center = Math.floor(cards.length / 2);
  const maxVisible = compact ? 2 : 3; // cards further out than this are hidden
  const stepDeg = SPREAD_DEG / Math.max(1, maxVisible);
  const spacing = Math.round(cardW * (1 - OVERLAP));

  return (
    <div
      className={cn("relative mx-auto flex justify-center overflow-hidden", className)}
      style={{ height: cardH + 56 }}
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
                      y: -16,
                      transition: { type: "spring", stiffness: 320, damping: 22 },
                    }
              }
            >
              <FanFace card={card} />
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

function FanFace({ card }: { card: FanCard }) {
  const impostor = Boolean(card.impostor);
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col rounded-2xl px-5 pt-5 shadow-[0_24px_48px_rgba(0,0,0,0.5)]",
        impostor ? "bg-heat text-heat-ink" : "bg-brand text-brand-ink",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-extrabold uppercase tracking-[0.16em]",
          impostor ? "text-heat-ink/65" : "text-brand-ink/70",
        )}
      >
        {card.category}
      </span>
      <span
        className={cn(
          "mt-2 block h-1 w-6 rounded-full",
          impostor ? "bg-heat-ink/30" : "bg-brand-ink/25",
        )}
        aria-hidden
      />
      <strong className="display mt-3 block text-[20px] leading-[1.05] sm:text-[25px]">
        {impostor ? "IMPOSTOR" : card.word}
      </strong>
    </div>
  );
}
