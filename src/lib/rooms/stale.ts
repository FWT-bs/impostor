export const ACTIVE_ROOM_TIMEOUT_MINUTES = 10;

export function getActiveRoomCutoffIso(now = Date.now()) {
  return new Date(now - ACTIVE_ROOM_TIMEOUT_MINUTES * 60_000).toISOString();
}

export function isWithinActiveRoomWindow(updatedAt?: string | null, now = Date.now()) {
  if (!updatedAt) return false;
  const updatedAtMs = Date.parse(updatedAt);
  if (!Number.isFinite(updatedAtMs)) return false;
  return updatedAtMs >= now - ACTIVE_ROOM_TIMEOUT_MINUTES * 60_000;
}
