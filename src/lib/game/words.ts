import wordData from "@/data/words.json";
import type { WordEntry } from "@/types/game";

const allWords: WordEntry[] = wordData as WordEntry[];

const CATEGORY_ALIASES: Record<string, string> = {
  Professions: "Jobs",
};

export function normalizeCategory(category: string): string {
  return CATEGORY_ALIASES[category] ?? category;
}

export function getCategories(): string[] {
  const cats = new Set(allWords.map((w) => normalizeCategory(w.category)));
  return Array.from(cats).sort();
}

export function getPremiumCategories(): Set<string> {
  const premium = new Set<string>();
  for (const w of allWords) {
    if (w.premium) premium.add(normalizeCategory(w.category));
  }
  return premium;
}

export function getWordsByCategory(category: string): WordEntry[] {
  const normalized = normalizeCategory(category);
  return allWords.filter((w) => normalizeCategory(w.category) === normalized);
}

export function pickWord(
  usedIndices: number[],
  category?: string | null
): { entry: WordEntry; index: number; hint: string } {
  let pool = allWords.map((entry, index) => ({ entry, index }));

  if (category) {
    const normalized = normalizeCategory(category);
    pool = pool.filter((item) => normalizeCategory(item.entry.category) === normalized);
  }

  const available = pool.filter((item) => !usedIndices.includes(item.index));

  const candidates = available.length > 0 ? available : pool;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    index: pick.index,
    // The raw descriptive theme ("Romantic Disaster Films") — shown to the
    // impostor as a faint hint. `entry.topic` stays normalised to the category
    // for everything that still reads it as the pack name.
    hint: pick.entry.topic,
    entry: {
      ...pick.entry,
      category: normalizeCategory(pick.entry.category),
      topic: normalizeCategory(pick.entry.category),
    },
  };
}

export function getTotalWordCount(): number {
  return allWords.length;
}
