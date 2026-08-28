"use client";

import { secondsUntil } from "@/lib/rooms/deadlines";
import { useEffect, useRef, useState } from "react";

/**
 * Seconds remaining until an ISO deadline, ticking once a second.
 * Returns null when there's no deadline to count down to.
 */
export function useCountdown(deadline: string | null | undefined): number | null {
  // The remaining time is derived from the deadline, not stored — the tick only
  // exists to re-render once a second, so there's no state to keep in sync.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return secondsUntil(deadline);
}

/**
 * Fire `onExpire` once per deadline, the moment it runs out.
 *
 * Every client in the room runs this, so the room keeps moving even if the
 * player whose turn it is has closed their tab. The matching API routes are
 * idempotent and re-check the deadline server-side, so the duplicate calls
 * that follow are harmless.
 */
export function useDeadlineTrigger(
  deadline: string | null | undefined,
  enabled: boolean,
  onExpire: () => void,
) {
  const firedFor = useRef<string | null>(null);
  const handler = useRef(onExpire);

  useEffect(() => {
    handler.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!enabled || !deadline) return;
    if (firedFor.current === deadline) return;

    const fire = () => {
      if (firedFor.current === deadline) return;
      firedFor.current = deadline;
      handler.current();
    };

    const remaining = secondsUntil(deadline);
    if (remaining === null) return;
    if (remaining <= 0) {
      fire();
      return;
    }
    const id = setTimeout(fire, remaining * 1000 + 250);
    return () => clearTimeout(id);
  }, [deadline, enabled]);
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}
