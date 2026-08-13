import type { BotDifficulty, ClueMode } from "@/lib/rooms/settings";

const CATEGORY_CLUES: Record<string, string[]> = {
  Animals: ["wild", "tail", "habitat", "creature", "tracks", "zoo"],
  "Body Parts": ["body", "touch", "joint", "skin", "move", "inside"],
  Clothing: ["wear", "fabric", "style", "closet", "outfit", "dress"],
  Movies: ["scene", "cast", "quote", "screen", "premiere", "camera"],
  Food: ["flavor", "plate", "snack", "kitchen", "crunch", "dinner"],
  Games: ["score", "turn", "level", "controller", "quest", "rules"],
  "Household Items": ["home", "room", "daily", "useful", "clean", "shelf"],
  Music: ["rhythm", "stage", "chorus", "tempo", "vinyl", "radio"],
  Nature: ["trail", "leaf", "wild", "river", "season", "forest"],
  Places: ["map", "street", "ticket", "visit", "border", "city"],
  Jobs: ["work", "skill", "uniform", "shift", "office", "career"],
  Professions: ["work", "skill", "uniform", "shift", "office", "career"],
  Sports: ["match", "team", "coach", "whistle", "field", "trophy"],
  Technology: ["screen", "signal", "device", "code", "battery", "update"],
  Vehicles: ["ride", "road", "engine", "trip", "speed", "wheels"],
  "Living things": ["wild", "habitat", "tracks", "creature", "zoo", "nature"],
  "The body": ["body", "touch", "joint", "skin", "move", "inside"],
  Style: ["wear", "fabric", "closet", "outfit", "fashion", "dress"],
  "Food and drinks": ["flavor", "plate", "snack", "kitchen", "crunch", "dinner"],
  Play: ["score", "turn", "level", "quest", "rules", "winner"],
  "Everyday stuff": ["home", "room", "daily", "useful", "clean", "shelf"],
  Entertainment: ["scene", "cast", "screen", "famous", "story", "camera"],
  Sound: ["rhythm", "stage", "chorus", "tempo", "radio", "listen"],
  "The outdoors": ["trail", "leaf", "wild", "river", "season", "forest"],
  "People and work": ["work", "skill", "uniform", "shift", "office", "career"],
  Action: ["match", "team", "coach", "field", "trophy", "move"],
  "Modern life": ["screen", "signal", "device", "battery", "update", "digital"],
  "Getting around": ["ride", "road", "engine", "trip", "speed", "wheels"],
};

const CREW_WORD_CLUES: Record<string, { vague: string[]; normal: string[]; strong: string[]; tooObvious: string[] }> = {
  Pilot: {
    vague: ["uniform", "travel", "training"],
    normal: ["landing", "altitude", "controls"],
    strong: ["runway", "cockpit"],
    tooObvious: ["airplane", "fly"],
  },
  Doctor: {
    vague: ["shift", "care", "training"],
    normal: ["clinic", "diagnosis", "stethoscope"],
    strong: ["patient", "hospital"],
    tooObvious: ["medicine", "doctor"],
  },
  Teacher: {
    vague: ["routine", "lesson", "group"],
    normal: ["classroom", "homework", "gradebook"],
    strong: ["students", "school"],
    tooObvious: ["teach", "teacher"],
  },
  Chef: {
    vague: ["heat", "timing", "taste"],
    normal: ["recipe", "kitchen", "plating"],
    strong: ["cook", "restaurant"],
    tooObvious: ["chef", "cooking"],
  },
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

  if (role === "impostor") {
    const salt = `${botName}:${topic}:category-only:${difficulty}`;
    const pool = difficulty === "tricky" ? [...topicPool, ...VAGUE_IMPOSTOR_CLUES] : VAGUE_IMPOSTOR_CLUES;
    return normalizeClue(pick(pool, salt), clueMode);
  }

  const clueMetadata = secretWord ? CREW_WORD_CLUES[secretWord] : null;
  const metadataPool = clueMetadata
    ? difficulty === "easy"
      ? [...clueMetadata.vague, ...clueMetadata.normal]
      : difficulty === "tricky"
        ? [...clueMetadata.normal, ...clueMetadata.strong]
        : clueMetadata.normal
    : [];
  const wordHints = metadataPool.length > 0 ? metadataPool : topicPool;
  const salt = `${botName}:${topic}:${secretWord ?? "crew"}:${difficulty}`;

  return normalizeClue(pick(wordHints, salt), clueMode);
}
