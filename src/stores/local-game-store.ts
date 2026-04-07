import { create } from "zustand";
import type {
  GamePhase,
  GameWinner,
  LocalGameState,
  LocalPlayer,
} from "@/types/game";
import { pickWord } from "@/lib/game/words";
import { determineWinner } from "@/lib/game/engine";
import { generateId } from "@/lib/utils";

interface LocalGameActions {
  initGame: (names: string[], category?: string | null) => void;
  setPhase: (phase: GamePhase) => void;
  submitClue: (playerId: string, clue: string) => void;
  advanceTurn: () => void;
  submitVote: (voterId: string, votedForId: string) => void;
  resolveVotes: () => void;
  playAgain: () => void;
  resetAll: () => void;
}

type LocalGameStore = LocalGameState & LocalGameActions;

const initialState: LocalGameState = {
  phase: "lobby",
  players: [],
  currentTurnIndex: 0,
  secretWord: "",
  topic: "",
  category: "",
  impostorId: "",
  winner: null,
  roundNumber: 0,
  sessionStats: { groupWins: 0, impostorWins: 0, rounds: 0 },
  usedWordIndices: [],
};

export const useLocalGameStore = create<LocalGameStore>((set, get) => ({
  ...initialState,

  initGame(names: string[], category?: string | null) {
    const state = get();
    const { entry, index } = pickWord(state.usedWordIndices, category);

    const impostorIdx = Math.floor(Math.random() * names.length);
    const players: LocalPlayer[] = names.map((name, i) => ({
      id: generateId(),
      name,
      role: i === impostorIdx ? "impostor" : "player",
      clue: null,
      votedFor: null,
      votesReceived: 0,
    }));

    set({
      phase: "role_reveal",
      players,
      currentTurnIndex: 0,
      secretWord: entry.word,
      topic: entry.topic,
      category: entry.category,
      impostorId: players[impostorIdx].id,
      winner: null,
      roundNumber: state.roundNumber + 1,
      usedWordIndices: [...state.usedWordIndices, index],
    });
  },

  setPhase(phase: GamePhase) {
    set({ phase });
  },

  submitClue(playerId: string, clue: string) {
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, clue } : p
      ),
    }));
  },

  advanceTurn() {
    const state = get();
    const nextIdx = state.currentTurnIndex + 1;
    set({ currentTurnIndex: nextIdx });
  },

  submitVote(voterId: string, votedForId: string) {
    set((s) => ({
      players: s.players.map((p) =>
        p.id === voterId ? { ...p, votedFor: votedForId } : p
      ),
    }));
  },

  resolveVotes() {
    const state = get();
    const voteMap: Record<string, string> = {};
    for (const p of state.players) {
      if (p.votedFor) voteMap[p.id] = p.votedFor;
    }

    const result = determineWinner(voteMap, [state.impostorId]);

    const playersWithCounts = state.players.map((p) => ({
      ...p,
      votesReceived: Object.values(voteMap).filter((v) => v === p.id).length,
    }));

    set((s) => ({
      phase: "results",
      winner: result.winner,
      players: playersWithCounts,
      sessionStats: {
        ...s.sessionStats,
        rounds: s.sessionStats.rounds + 1,
        groupWins:
          s.sessionStats.groupWins + (result.winner === "group" ? 1 : 0),
        impostorWins:
          s.sessionStats.impostorWins + (result.winner === "impostor" ? 1 : 0),
      },
    }));
  },

  playAgain() {
    const state = get();
    const names = state.players.map((p) => p.name);
    get().initGame(names, state.category || null);
  },

  resetAll() {
    set(initialState);
  },
}));
