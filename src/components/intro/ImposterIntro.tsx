"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

const INTRO_STORAGE_KEY = "imposter_intro_seen";
const INTRO_DURATION_MS = 1750;
const REDUCED_DURATION_MS = 850;

export function ImposterIntro() {
  const [visible, setVisible] = useState(false);
  const forceReplayRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const search = new URLSearchParams(window.location.search);
      const forced = search.get("intro") === "1";
      forceReplayRef.current = forced;

      let hasSeenIntro = false;
      try {
        hasSeenIntro = window.localStorage.getItem(INTRO_STORAGE_KEY) === "true";
      } catch {
        hasSeenIntro = false;
      }

      if (forced || !hasSeenIntro) setVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const timer = window.setTimeout(() => {
      if (!forceReplayRef.current) {
        try {
          window.localStorage.setItem(INTRO_STORAGE_KEY, "true");
        } catch {
          // Storage can be unavailable in strict/private contexts; the intro remains harmless.
        }
      }
      setVisible(false);
    }, reduceMotion ? REDUCED_DURATION_MS : INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [reduceMotion, visible]);

  const armMotion = useMemo(
    () =>
      reduceMotion
        ? {
            initial: { rotate: -23, x: 10, y: -34 },
            animate: { rotate: -23, x: 10, y: -34 },
          }
        : {
            initial: { rotate: 18, x: -6, y: 7 },
            animate: { rotate: -23, x: 10, y: -34 },
          },
    [reduceMotion],
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden="true"
          className="intro-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.18 : 0.28, ease: "easeOut" }}
        >
          <motion.div
            className="intro-stage"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.9 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.97 }}
            transition={
              reduceMotion
                ? { duration: 0.18, ease: "easeOut" }
                : { delay: 0.05, duration: 0.52, type: "spring", stiffness: 360, damping: 24, mass: 0.72 }
            }
          >
            <motion.div
              className="intro-character"
              animate={reduceMotion ? undefined : { y: [0, -1.5, 0] }}
              transition={reduceMotion ? undefined : { delay: 0.88, duration: 0.55, ease: "easeInOut" }}
            >
              <div className="intro-body" />
              <div className="intro-head">
                <span className="intro-eye intro-eye-left" />
                <span className="intro-eye intro-eye-right" />
                <span className="intro-mouth" />
              </div>
              <div className="intro-arm intro-arm-rest" />
              <motion.div
                className="intro-arm intro-arm-shush"
                initial={armMotion.initial}
                animate={armMotion.animate}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { delay: 0.45, duration: 0.36, ease: [0.16, 1, 0.3, 1] }
                }
              >
                <span className="intro-palm" />
                <span className="intro-finger" />
              </motion.div>
            </motion.div>

            <motion.p
              className="intro-shhh"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -3 }}
              transition={{
                delay: reduceMotion ? 0.05 : 0.75,
                duration: reduceMotion ? 0.12 : 0.2,
                ease: "easeOut",
              }}
            >
              shhh...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
