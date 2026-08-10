export type ImpostorCountSetting = "auto" | 1 | 2;
export type ClueMode = "classic" | "short" | "single";
export type BotDifficulty = "easy" | "normal" | "tricky";

export type RoomSettings = {
  discussionTimer: number;
  votingTimer: number;
  category: string | null;
  impostorCount: ImpostorCountSetting;
  clueMode: ClueMode;
  botDifficulty: BotDifficulty;
  aiTable?: boolean;
  aiTableId?: string;
  tableLabel?: string;
};

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  discussionTimer: 60,
  votingTimer: 30,
  category: null,
  impostorCount: "auto",
  clueMode: "classic",
  botDifficulty: "normal",
};

export function clampWholeNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeImpostorCount(value: unknown): ImpostorCountSetting {
  if (value === 1 || value === "1") return 1;
  if (value === 2 || value === "2") return 2;
  return "auto";
}

export function normalizeClueMode(value: unknown): ClueMode {
  if (value === "short" || value === "single") return value;
  return "classic";
}

export function normalizeBotDifficulty(value: unknown): BotDifficulty {
  if (value === "easy" || value === "tricky") return value;
  return "normal";
}

export function normalizeRoomSettings(input: {
  discussionTimer?: unknown;
  votingTimer?: unknown;
  category?: unknown;
  impostorCount?: unknown;
  clueMode?: unknown;
  botDifficulty?: unknown;
  aiTable?: unknown;
  aiTableId?: unknown;
  tableLabel?: unknown;
}): RoomSettings {
  const category = typeof input.category === "string" && input.category.trim()
    ? input.category.trim()
    : null;
  return {
    discussionTimer: clampWholeNumber(input.discussionTimer, 30, 300, DEFAULT_ROOM_SETTINGS.discussionTimer),
    votingTimer: clampWholeNumber(input.votingTimer, 15, 180, DEFAULT_ROOM_SETTINGS.votingTimer),
    category,
    impostorCount: normalizeImpostorCount(input.impostorCount),
    clueMode: normalizeClueMode(input.clueMode),
    botDifficulty: normalizeBotDifficulty(input.botDifficulty),
    ...(input.aiTable === true ? { aiTable: true } : {}),
    ...(typeof input.aiTableId === "string" ? { aiTableId: input.aiTableId } : {}),
    ...(typeof input.tableLabel === "string" ? { tableLabel: input.tableLabel } : {}),
  };
}

export function resolveImpostorCount(players: number, setting: ImpostorCountSetting | undefined): number {
  const requested = setting === 1 || setting === 2 ? setting : players > 5 ? 2 : 1;
  return Math.min(Math.max(1, requested), Math.max(1, players - 1));
}

export function describeImpostorCount(setting: ImpostorCountSetting | undefined): string {
  if (setting === 1 || setting === 2) return String(setting);
  return "Auto";
}
