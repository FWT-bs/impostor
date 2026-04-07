import type { GamePhase, GameWinner } from "@/types/game";

const PHASE_ORDER: GamePhase[] = [
  "lobby",
  "role_reveal",
  "clue_phase",
  "discussion",
  "voting",
  "results",
];

export function nextPhase(current: GamePhase): GamePhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

export function tallyVotes(
  votes: Record<string, string>
): { targetId: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const votedFor of Object.values(votes)) {
    counts[votedFor] = (counts[votedFor] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([targetId, count]) => ({ targetId, count }))
    .sort((a, b) => b.count - a.count);
}

export function determineWinner(
  votes: Record<string, string>,
  impostorIds: string[]
): { winner: GameWinner; votedOutId: string | null; isTie: boolean } {
  const impostorSet = new Set(
    impostorIds.filter((id): id is string => Boolean(id)),
  );
  const tally = tallyVotes(votes);

  if (tally.length === 0) {
    return { winner: "impostor", votedOutId: null, isTie: false };
  }

  const topCount = tally[0].count;
  const tied = tally.filter((t) => t.count === topCount);

  if (tied.length > 1) {
    return { winner: "impostor", votedOutId: null, isTie: true };
  }

  const votedOutId = tally[0].targetId;
  const winner: GameWinner = impostorSet.has(votedOutId)
    ? "group"
    : "impostor";

  return { winner, votedOutId, isTie: false };
}

export function isPhaseTimerBased(phase: GamePhase): boolean {
  return phase === "discussion" || phase === "voting";
}

export function getDefaultTimerSeconds(phase: GamePhase): number {
  switch (phase) {
    case "discussion":
      return 60;
    case "voting":
      return 30;
    default:
      return 0;
  }
}
