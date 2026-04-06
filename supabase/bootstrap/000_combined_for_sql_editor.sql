-- =============================================================
-- IMPOSTOR GAME — Complete Database Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- Tables are created first, then RLS policies are added after
-- all tables exist (to avoid forward-reference errors).
-- =============================================================

-- ===================== TABLES =====================

-- 1. PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  avatar_color text NOT NULL DEFAULT '#06b6d4',
  games_played integer NOT NULL DEFAULT 0,
  group_wins integer NOT NULL DEFAULT 0,
  impostor_wins integer NOT NULL DEFAULT 0,
  impostor_games integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. ROOMS
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code char(4) NOT NULL UNIQUE,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  phase text NOT NULL DEFAULT 'lobby' CHECK (phase IN ('lobby', 'role_reveal', 'clue_phase', 'discussion', 'voting', 'results')),
  current_turn_index integer NOT NULL DEFAULT 0,
  current_round_id uuid,
  settings jsonb NOT NULL DEFAULT '{"discussionTimer": 60, "category": null}'::jsonb,
  max_players integer NOT NULL DEFAULT 10,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_code ON public.rooms(code);
CREATE INDEX idx_rooms_status ON public.rooms(status);

-- 3. ROOM PLAYERS
CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  is_ready boolean NOT NULL DEFAULT false,
  is_host boolean NOT NULL DEFAULT false,
  player_order integer NOT NULL DEFAULT 0,
  clue_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_players_room ON public.room_players(room_id);
CREATE INDEX idx_room_players_user ON public.room_players(user_id);

-- 4. GAME ROUNDS
CREATE TABLE public.game_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  round_number integer NOT NULL DEFAULT 1,
  topic text NOT NULL,
  secret_word text NOT NULL,
  impostor_id uuid NOT NULL REFERENCES public.profiles(id),
  winner text CHECK (winner IN ('group', 'impostor')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_rounds_room ON public.game_rounds(room_id);

-- 5. PLAYER SECRETS
CREATE TABLE public.player_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('impostor', 'player')),
  secret_word text,
  topic text NOT NULL,
  UNIQUE(round_id, user_id)
);

CREATE INDEX idx_player_secrets_round ON public.player_secrets(round_id);
CREATE INDEX idx_player_secrets_user ON public.player_secrets(user_id);

-- 6. VOTES
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voted_for_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(round_id, voter_id)
);

CREATE INDEX idx_votes_round ON public.votes(round_id);

-- ===================== VIEW =====================

CREATE VIEW public.game_rounds_public AS
SELECT
  id, room_id, round_number, topic, secret_word,
  CASE WHEN status = 'completed' THEN impostor_id ELSE NULL END AS impostor_id,
  winner, status, created_at
FROM public.game_rounds;

-- ===================== TRIGGERS / FUNCTIONS =====================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player_' || substr(NEW.id::text, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_color', '#06b6d4')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update rooms.updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===================== RLS POLICIES =====================
-- All tables exist now, so cross-table references in policies are safe.

-- PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ROOMS RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public waiting rooms or own rooms" ON public.rooms
  FOR SELECT USING (
    (status = 'waiting' AND is_private = false)
    OR id IN (SELECT room_id FROM public.room_players WHERE user_id = auth.uid())
  );
CREATE POLICY "Authenticated users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update room" ON public.rooms
  FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can delete room" ON public.rooms
  FOR DELETE USING (auth.uid() = host_id);

-- ROOM PLAYERS RLS
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room members can view players" ON public.room_players
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM public.room_players rp WHERE rp.user_id = auth.uid())
    OR room_id IN (SELECT id FROM public.rooms WHERE status = 'waiting')
  );
CREATE POLICY "Authenticated users can join rooms" ON public.room_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can update own row" ON public.room_players
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can leave rooms" ON public.room_players
  FOR DELETE USING (
    auth.uid() = user_id
    OR room_id IN (SELECT id FROM public.rooms WHERE host_id = auth.uid())
  );

-- GAME ROUNDS RLS
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room members can view rounds" ON public.game_rounds
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM public.room_players WHERE user_id = auth.uid())
  );

-- PLAYER SECRETS RLS
ALTER TABLE public.player_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can only see own secret" ON public.player_secrets
  FOR SELECT USING (auth.uid() = user_id);

-- VOTES RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes visible after round complete" ON public.votes
  FOR SELECT USING (
    round_id IN (
      SELECT id FROM public.game_rounds
      WHERE status = 'completed'
      AND room_id IN (SELECT room_id FROM public.room_players WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "Players can cast own vote" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ===================== REALTIME =====================

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
