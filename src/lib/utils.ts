import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generateId(): string {
  return crypto.randomUUID();
}

const AVATAR_COLORS = [
  "#1155f6", "#ef493a", "#f4b218", "#15925f", "#7ac4ad",
  "#8a67d4", "#f27a3d", "#1e9bd1", "#f16d9d", "#0f6f58",
];

export function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/** Tabletop pawn palette used for player tokens. */
export const TOKEN_COLORS = [
  "#1155f6", "#ef493a", "#f4b218", "#15925f", "#7ac4ad",
  "#8a67d4", "#f27a3d", "#1e9bd1", "#f16d9d", "#0f6f58",
];

/** Deterministic vivid color from any seed (name/id) so a player keeps one hue. */
export function tokenColor(seed: string): string {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TOKEN_COLORS[h % TOKEN_COLORS.length];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? singular + "s");
}

export function formatTimerSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
