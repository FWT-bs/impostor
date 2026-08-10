import type { BotDifficulty, ClueMode } from "@/lib/rooms/settings";

const CATEGORY_CLUES: Record<string, string[]> = {
  Movies: ["scene", "cast", "quote", "screen", "premiere", "camera"],
  Food: ["flavor", "plate", "snack", "kitchen", "crunch", "dinner"],
  Games: ["score", "turn", "level", "controller", "quest", "rules"],
  Music: ["rhythm", "stage", "chorus", "tempo", "vinyl", "radio"],
  Nature: ["trail", "leaf", "wild", "river", "season", "forest"],
  Places: ["map", "street", "ticket", "visit", "border", "city"],
  Sports: ["match", "team", "coach", "whistle", "field", "trophy"],
  Technology: ["screen", "signal", "device", "code", "battery", "update"],
};

const SAFE_GENERIC_CLUES = [
  "memory",
  "table",
  "signal",
  "classic",
  "guess",
  "secret",
  "night",
  "pattern",
];

const VAGUE_IMPOSTOR_CLUES = [
  "popular",
  "familiar",
  "common",
  "famous",
  "casual",
  "group",
  "old",
  "random",
];

function pick(items: string[], salt: string) {
  const seed = [...salt].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return items[seed % items.length] ?? items[0] ?? "hint";
}

function normalizeClue(clue: string, mode: ClueMode | undefined) {
  const clean = clue.trim().replace(/\s+/g, " ");
  if (mode === "single") return clean.split(" ")[0] ?? clean;
  if (mode === "short") return clean.slice(0, 18);
  return clean;
}

export function chooseBotClue({
  role,
  topic,
  secretWord,
  botName,
  difficulty = "normal",
  clueMode = "classic",
}: {
  role: string;
  topic: string;
  secretWord: string | null;
  botName: string;
  difficulty?: BotDifficulty;
  clueMode?: ClueMode;
}): string {
  const topicPool = CATEGORY_CLUES[topic] ?? SAFE_GENERIC_CLUES;
  const salt = `${botName}:${topic}:${secretWord ?? "impostor"}:${difficulty}`;

  if (role === "impostor") {
    const pool = difficulty === "tricky" ? [...topicPool, ...VAGUE_IMPOSTOR_CLUES] : VAGUE_IMPOSTOR_CLUES;
    return normalizeClue(pick(pool, salt), clueMode);
  }

  const word = (secretWord ?? "").toLowerCase();
  const wordHints = [
    ...topicPool,
    word.length >= 8 ? "specific" : "simple",
    word.includes(" ") ? "phrase" : "single",
    word.length % 2 === 0 ? "even" : "odd",
  ];

  return normalizeClue(pick(wordHints, salt), clueMode);
}
