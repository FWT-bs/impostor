import type { BotDifficulty, ClueMode, ImpostorCountSetting, RoomSettings } from "@/lib/rooms/settings";

export type AiTable = {
  id: string;
  label: string;
  code: string;
  topic: string | null;
  bots: string[];
  maxPlayers: number;
  settings: Pick<RoomSettings, "discussionTimer" | "votingTimer" | "category" | "impostorCount" | "clueMode" | "botDifficulty">;
  note: string;
};

export const AI_TABLES: AiTable[] = [
  {
    id: "hush",
    label: "Hush table",
    code: "HUSH",
    topic: "Movies",
    bots: ["Mira", "Jules"],
    maxPlayers: 6,
    settings: {
      discussionTimer: 60,
      votingTimer: 30,
      category: "Movies",
      impostorCount: "auto",
      clueMode: "classic",
      botDifficulty: "normal",
    },
    note: "two bots waiting, starts when you sit down",
  },
  {
    id: "red",
    label: "Red herring",
    code: "RED?",
    topic: "Random pack",
    bots: ["Nova", "Theo"],
    maxPlayers: 7,
    settings: {
      discussionTimer: 75,
      votingTimer: 35,
      category: null,
      impostorCount: "auto",
      clueMode: "short",
      botDifficulty: "tricky",
    },
    note: "a little sharper, still clearly AI",
  },
  {
    id: "vault",
    label: "Topic vault",
    code: "VAUL",
    topic: "Food",
    bots: ["Casey", "Luna"],
    maxPlayers: 6,
    settings: {
      discussionTimer: 45,
      votingTimer: 25,
      category: "Food",
      impostorCount: 1,
      clueMode: "single",
      botDifficulty: "normal",
    },
    note: "quick clues, quiet table",
  },
];

export function getAiTable(tableId: string): AiTable | null {
  return AI_TABLES.find((table) => table.id === tableId) ?? null;
}

export function isImpostorSetting(value: unknown): value is ImpostorCountSetting {
  return value === "auto" || value === 1 || value === 2;
}

export function isClueMode(value: unknown): value is ClueMode {
  return value === "classic" || value === "short" || value === "single";
}

export function isBotDifficulty(value: unknown): value is BotDifficulty {
  return value === "easy" || value === "normal" || value === "tricky";
}
