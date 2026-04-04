import wordData from "@/data/words.json";
import type { WordEntry } from "@/types/game";

const allWords: WordEntry[] = wordData as WordEntry[];

export function getCategories(): string[] {
  const cats = new Set(allWords.map((w) => w.category));
  return Array.from(cats).sort();
}

export function getPremiumCategories(): Set<string> {
  const premium = new Set<string>();
  for (const w of allWords) {
    if (w.premium) premium.add(w.category);
  }
  return premium;
}

export function getWordsByCategory(category: string): WordEntry[] {
  return allWords.filter((w) => w.category === category);
}

export function pickWord(
  usedIndices: number[],
  category?: string | null
): { entry: WordEntry; index: number } {
  let pool = allWords.map((entry, index) => ({ entry, index }));

  if (category) {
    pool = pool.filter((item) => item.entry.category === category);
  }

  const available = pool.filter((item) => !usedIndices.includes(item.index));

  const candidates = available.length > 0 ? available : pool;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return pick;
}

export function getTotalWordCount(): number {
  return allWords.length;
}
