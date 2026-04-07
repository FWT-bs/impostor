export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Relationships: [];
        Row: {
          id: string;
          username: string;
          avatar_color: string;
          avatar_url: string | null;
          games_played: number;
          group_wins: number;
          impostor_wins: number;
          impostor_games: number;
          total_wins: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_color?: string;
          avatar_url?: string | null;
          games_played?: number;
          group_wins?: number;
          impostor_wins?: number;
          impostor_games?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_color?: string;
          avatar_url?: string | null;
          games_played?: number;
          group_wins?: number;
          impostor_wins?: number;
          impostor_games?: number;
          created_at?: string;
        };
      };
      rooms: {
        Relationships: [];
        Row: {
          id: string;
          code: string;
          host_id: string;
          status: string;
          phase: string;
          current_turn_index: number;
          current_round_id: string | null;
          settings: Json;
          max_players: number;
          is_private: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          host_id: string;
          status?: string;
          phase?: string;
          current_turn_index?: number;
          current_round_id?: string | null;
          settings?: Json;
          max_players?: number;
          is_private?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          host_id?: string;
          status?: string;
          phase?: string;
          current_turn_index?: number;
          current_round_id?: string | null;
          settings?: Json;
          max_players?: number;
          is_private?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      room_players: {
        Relationships: [];
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          display_name: string;
          is_ready: boolean;
          is_host: boolean;
          player_order: number;
          clue_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          display_name: string;
          is_ready?: boolean;
          is_host?: boolean;
          player_order?: number;
          clue_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          display_name?: string;
          is_ready?: boolean;
          is_host?: boolean;
          player_order?: number;
          clue_text?: string | null;
          created_at?: string;
        };
      };
      player_secrets: {
        Relationships: [];
        Row: {
          id: string;
          room_id: string;
          round_id: string;
          user_id: string;
          role: string;
          secret_word: string | null;
          topic: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round_id: string;
          user_id: string;
          role: string;
          secret_word?: string | null;
          topic: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          round_id?: string;
          user_id?: string;
          role?: string;
          secret_word?: string | null;
          topic?: string;
        };
      };
      game_rounds: {
        Relationships: [];
        Row: {
          id: string;
          room_id: string;
          round_number: number;
          topic: string;
          secret_word: string;
          impostor_id: string;
          second_impostor_id: string | null;
          winner: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round_number?: number;
          topic: string;
          secret_word: string;
          impostor_id: string;
          second_impostor_id?: string | null;
          winner?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          round_number?: number;
          topic?: string;
          secret_word?: string;
          impostor_id?: string;
          second_impostor_id?: string | null;
          winner?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      votes: {
        Relationships: [];
        Row: {
          id: string;
          round_id: string;
          voter_id: string;
          voted_for_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          voter_id: string;
          voted_for_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          voter_id?: string;
          voted_for_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      game_rounds_public: {
        Relationships: [];
        Row: {
          id: string;
          room_id: string;
          round_number: number;
          topic: string;
          secret_word: string;
          impostor_id: string | null;
          second_impostor_id: string | null;
          winner: string | null;
          status: string;
          created_at: string;
        };
      };
    };
    Functions: Record<string, never>;
  };
}
