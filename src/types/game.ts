export type GamePhase =
  | "lobby"
  | "role_reveal"
  | "clue_phase"
  | "discussion"
  | "voting"
  | "results";

export type PlayerRole = "impostor" | "player";

export type RoomStatus = "waiting" | "playing" | "finished";

export type GameWinner = "group" | "impostor" | null;

export interface WordEntry {
  word: string;
  topic: string;
  category: string;
  premium?: boolean;
}

export interface LocalPlayer {
  id: string;
  name: string;
  role: PlayerRole;
  clue: string | null;
  votedFor: string | null;
  votesReceived: number;
}

export interface LocalGameState {
  phase: GamePhase;
  players: LocalPlayer[];
  currentTurnIndex: number;
  secretWord: string;
  topic: string;
  category: string;
  impostorId: string;
  winner: GameWinner;
  roundNumber: number;
  sessionStats: {
    groupWins: number;
    impostorWins: number;
    rounds: number;
  };
  usedWordIndices: number[];
}

export interface RoomSettings {
  discussionTimer: number;
  category: string | null;
  maxPlayers: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: number;
}
