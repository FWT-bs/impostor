/**
 * Room countdowns.
 *
 * Deadlines live inside the room's `settings` jsonb as ISO timestamps, so they
 * replicate to every client through the existing realtime subscription on
 * `rooms` — no extra table or polling channel. Clients render the countdown
 * locally and, when it runs out, poke the matching API route; the server is the
 * one that re-checks the deadline before acting, so a client with a skewed
 * clock (or a tampered request) can't rush a phase.
 */

/** Seconds a lobby waits before it starts itself, once it has enough players. */
export const LOBBY_AUTO_START_SECONDS = 120;

/** Seconds each player gets to give their clue before the turn auto-advances. */
export const CLUE_TURN_SECONDS = 40;

/** Fewest players a round can start with. */
export const MIN_ROOM_PLAYERS = 3;

export type RoomDeadlines = {
  /** When the lobby auto-starts. */
  startsAt?: string | null;
  /** When the current clue turn expires. */
  turnEndsAt?: string | null;
  /** When the current voting / discussion phase expires. */
  phaseEndsAt?: string | null;
};

export function isoIn(seconds: number, from: number = Date.now()): string {
  return new Date(from + seconds * 1000).toISOString();
}

/** Whole seconds left until `iso`, or null when there's no deadline. */
export function secondsUntil(iso: unknown, now: number = Date.now()): number | null {
  if (typeof iso !== "string" || !iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.ceil((ms - now) / 1000));
}

/** True once `iso` is in the past. A missing deadline never expires. */
export function hasPassed(iso: unknown, now: number = Date.now()): boolean {
  if (typeof iso !== "string" || !iso) return false;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return false;
  return ms <= now;
}

/** Shape of the `rooms.settings` jsonb column. */
type SettingsJson = { [key: string]: JsonValue | undefined };
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue | undefined } | JsonValue[];

/**
 * Merge deadline fields into a settings object.
 * `null` clears a deadline; `undefined` leaves it untouched.
 */
export function withDeadlines(settings: unknown, next: RoomDeadlines): SettingsJson {
  const base: SettingsJson =
    settings && typeof settings === "object" ? { ...(settings as SettingsJson) } : {};
  for (const key of ["startsAt", "turnEndsAt", "phaseEndsAt"] as const) {
    if (!(key in next)) continue;
    const value = next[key];
    if (value == null) delete base[key];
    else base[key] = value;
  }
  return base;
}

export function readDeadlines(settings: unknown): RoomDeadlines {
  if (!settings || typeof settings !== "object") return {};
  const s = settings as Record<string, unknown>;
  const pick = (key: string) => (typeof s[key] === "string" ? (s[key] as string) : null);
  return {
    startsAt: pick("startsAt"),
    turnEndsAt: pick("turnEndsAt"),
    phaseEndsAt: pick("phaseEndsAt"),
  };
}
