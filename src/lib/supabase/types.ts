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
          stripe_customer_id: string | null;
          is_premium: boolean;
          premium_until: string | null;
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
          stripe_customer_id?: string | null;
          is_premium?: boolean;
          premium_until?: string | null;
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
          stripe_customer_id?: string | null;
          is_premium?: boolean;
          premium_until?: string | null;
          games_played?: number;
          group_wins?: number;
          impostor_wins?: number;
          impostor_games?: number;
          created_at?: string;
        };
      };
      rooms: {
        Relationships: [
          {
            foreignKeyName: "rooms_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
          completed_at: string | null;
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
          completed_at?: string | null;
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
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      room_players: {
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_players_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "player_secrets_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_secrets_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "game_rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_secrets_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "game_rounds_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_secrets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "game_rounds_impostor_id_fkey";
            columns: ["impostor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rounds_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_rounds_second_impostor_id_fkey";
            columns: ["second_impostor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "votes_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "game_rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "game_rounds_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_voted_for_id_fkey";
            columns: ["voted_for_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
      chat_messages: {
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          room_id: string;
          user_id: string | null;
          display_name: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id?: string | null;
          display_name: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string | null;
          display_name?: string;
          text?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      game_rounds_public: {
        Relationships: [
          {
            foreignKeyName: "game_rounds_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
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
    Functions: {
      cleanup_stale_rooms: {
        Args: Record<string, never>;
        Returns: Json;
      };
      is_room_member: {
        Args: { p_room_id: string };
        Returns: boolean;
      };
      is_waiting_room: {
        Args: { p_room_id: string };
        Returns: boolean;
      };
      user_room_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
  };
}
