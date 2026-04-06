"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingCharacterProps {
  children: React.ReactNode;
  className?: string;
  /** Which side the character drifts in from */
  from?: "left" | "right" | "bottom";
  /** Seconds to delay the entrance animation */
  delay?: number;
  /** Pixels of vertical float amplitude */
  floatAmplitude?: number;
  /** Seconds per float cycle */
  floatDuration?: number;
  /** Whether to also apply a slight rotation sway */
  sway?: boolean;
}

export function FloatingCharacter({
  children,
  className,
  from = "left",
  delay = 0,
  floatAmplitude = 12,
  floatDuration = 4.5,
  sway = false,
}: FloatingCharacterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const initial =
    from === "left"
      ? { x: -90, opacity: 0 }
      : from === "right"
        ? { x: 90, opacity: 0 }
        : { y: 40, opacity: 0 };

  const visible =
    from === "left"
      ? { x: 0, opacity: 1 }
      : from === "right"
        ? { x: 0, opacity: 1 }
        : { y: 0, opacity: 1 };

  return (
    <div ref={ref} className={cn("pointer-events-none select-none", className)}>
      {/* Entrance slide */}
      <motion.div
        initial={initial}
        animate={isInView ? visible : initial}
        transition={{
          delay,
          duration: 0.9,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {/* Continuous float */}
        <motion.div
          animate={{
            y: [0, -floatAmplitude, 0],
            rotate: sway ? [-1.5, 1.5, -1.5] : 0,
          }}
          transition={{
            duration: floatDuration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay * 0.3,
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
