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
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_rooms_code ON public.rooms(code);
CREATE INDEX idx_rooms_status ON public.rooms(status);
CREATE INDEX idx_rooms_status_private ON public.rooms(status, is_private);
CREATE INDEX idx_rooms_updated_at ON public.rooms(updated_at DESC);

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

-- Auto-create profile on signup (ON CONFLICT protects against retries / race conditions)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player_' || substr(NEW.id::text, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_color', '#06b6d4')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- SECURITY DEFINER helpers — bypass RLS for cross-table lookups inside policies
-- (prevents infinite recursion when policies reference each other's tables)
CREATE OR REPLACE FUNCTION public.user_room_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT room_id FROM public.room_players WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_id = p_room_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_waiting_room(p_room_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rooms
    WHERE id = p_room_id
      AND status = 'waiting'
      AND updated_at >= now() - interval '10 minutes'
  )
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

CREATE OR REPLACE FUNCTION public.cleanup_stale_rooms()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count integer;
  finished_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.rooms
    WHERE status = 'waiting'
      AND updated_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  WITH finished AS (
    UPDATE public.rooms
    SET status = 'finished', completed_at = COALESCE(completed_at, now())
    WHERE status = 'playing'
      AND updated_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO finished_count FROM finished;

  RETURN jsonb_build_object(
    'deleted_waiting', deleted_count,
    'finished_playing', finished_count,
    'inactive_after_minutes', 10
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_stale_rooms() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_room_on_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_room_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_room_id := OLD.room_id;
  ELSE
    target_room_id := NEW.room_id;
  END IF;

  UPDATE public.rooms
  SET updated_at = now()
  WHERE id = target_room_id
    AND status <> 'finished';

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_room_on_activity() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER room_players_touch_room
  AFTER INSERT OR UPDATE OR DELETE ON public.room_players
  FOR EACH ROW EXECUTE FUNCTION public.touch_room_on_activity();

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
    (
      is_private = false
      AND updated_at >= now() - interval '10 minutes'
      AND (
        status = 'waiting'
        OR (status = 'playing' AND phase <> 'results')
      )
    )
    OR id IN (SELECT public.user_room_ids())
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
    public.is_room_member(room_id)
    OR public.is_waiting_room(room_id)
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
    room_id IN (SELECT public.user_room_ids())
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
      AND room_id IN (SELECT public.user_room_ids())
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

-- ===================== CHAT MESSAGES (persistent table chat) =====================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  text text NOT NULL CHECK (char_length(text) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can read chat" ON public.chat_messages
  FOR SELECT USING (room_id IN (SELECT public.user_room_ids()));

CREATE POLICY "Room members can post chat" ON public.chat_messages
  FOR INSERT WITH CHECK (
    room_id IN (SELECT public.user_room_ids())
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

CREATE TRIGGER chat_messages_touch_room
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_room_on_activity();

-- ===================== AI PRACTICE TABLES / BOT SEATS =====================

CREATE TABLE IF NOT EXISTS public.bot_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  avatar_color text NOT NULL DEFAULT '#22c55e',
  personality text NOT NULL DEFAULT 'steady',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view bot profiles" ON public.bot_profiles;
CREATE POLICY "Anyone can view bot profiles" ON public.bot_profiles
  FOR SELECT
  USING (true);

GRANT SELECT ON public.bot_profiles TO anon, authenticated;

INSERT INTO public.bot_profiles (name, avatar_color, personality)
VALUES
  ('Mira', '#22c55e', 'careful'),
  ('Jules', '#facc15', 'friendly'),
  ('Nova', '#ef4444', 'bold'),
  ('Theo', '#2563eb', 'quiet'),
  ('Casey', '#34d399', 'suspicious'),
  ('Luna', '#f97316', 'chaotic')
ON CONFLICT (name) DO UPDATE SET
  avatar_color = EXCLUDED.avatar_color,
  personality = EXCLUDED.personality;

ALTER TABLE public.room_players
  ADD COLUMN IF NOT EXISTS bot_id uuid REFERENCES public.bot_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;

ALTER TABLE public.room_players
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.room_players
  DROP CONSTRAINT IF EXISTS room_players_room_id_user_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'room_players_identity_check'
  ) THEN
    ALTER TABLE public.room_players
      ADD CONSTRAINT room_players_identity_check
      CHECK (
        (
          is_bot = true
          AND bot_id IS NOT NULL
          AND user_id IS NULL
        )
        OR
        (
          is_bot = false
          AND user_id IS NOT NULL
          AND bot_id IS NULL
        )
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS room_players_room_user_unique
  ON public.room_players(room_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS room_players_room_bot_unique
  ON public.room_players(room_id, bot_id)
  WHERE bot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_room_players_bot
  ON public.room_players(bot_id);

ALTER TABLE public.game_rounds
  ADD COLUMN IF NOT EXISTS impostor_bot_id uuid REFERENCES public.bot_profiles(id),
  ADD COLUMN IF NOT EXISTS second_impostor_bot_id uuid REFERENCES public.bot_profiles(id);

ALTER TABLE public.game_rounds
  ALTER COLUMN impostor_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'game_rounds_impostor_identity_check'
  ) THEN
    ALTER TABLE public.game_rounds
      ADD CONSTRAINT game_rounds_impostor_identity_check
      CHECK (
        ((impostor_id IS NOT NULL)::int + (impostor_bot_id IS NOT NULL)::int) = 1
        AND
        ((second_impostor_id IS NOT NULL)::int + (second_impostor_bot_id IS NOT NULL)::int) <= 1
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_game_rounds_impostor_bot
  ON public.game_rounds(impostor_bot_id);

CREATE INDEX IF NOT EXISTS idx_game_rounds_second_impostor_bot
  ON public.game_rounds(second_impostor_bot_id);

ALTER TABLE public.player_secrets
  ADD COLUMN IF NOT EXISTS bot_id uuid REFERENCES public.bot_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;

ALTER TABLE public.player_secrets
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.player_secrets
  DROP CONSTRAINT IF EXISTS player_secrets_round_id_user_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'player_secrets_identity_check'
  ) THEN
    ALTER TABLE public.player_secrets
      ADD CONSTRAINT player_secrets_identity_check
      CHECK (
        (
          is_bot = true
          AND bot_id IS NOT NULL
          AND user_id IS NULL
        )
        OR
        (
          is_bot = false
          AND user_id IS NOT NULL
          AND bot_id IS NULL
        )
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS player_secrets_round_user_unique
  ON public.player_secrets(round_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS player_secrets_round_bot_unique
  ON public.player_secrets(round_id, bot_id)
  WHERE bot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_player_secrets_bot
  ON public.player_secrets(bot_id);

ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS voter_bot_id uuid REFERENCES public.bot_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS voted_for_bot_id uuid REFERENCES public.bot_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.votes
  ALTER COLUMN voter_id DROP NOT NULL,
  ALTER COLUMN voted_for_id DROP NOT NULL;

ALTER TABLE public.votes
  DROP CONSTRAINT IF EXISTS votes_round_id_voter_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_voter_identity_check'
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_voter_identity_check
      CHECK (((voter_id IS NOT NULL)::int + (voter_bot_id IS NOT NULL)::int) = 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_target_identity_check'
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_target_identity_check
      CHECK (((voted_for_id IS NOT NULL)::int + (voted_for_bot_id IS NOT NULL)::int) = 1);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS votes_round_human_voter_unique
  ON public.votes(round_id, voter_id)
  WHERE voter_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS votes_round_bot_voter_unique
  ON public.votes(round_id, voter_bot_id)
  WHERE voter_bot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_votes_voter_bot
  ON public.votes(voter_bot_id);

CREATE INDEX IF NOT EXISTS idx_votes_voted_for_bot
  ON public.votes(voted_for_bot_id);

DROP VIEW IF EXISTS public.game_rounds_public;
CREATE VIEW public.game_rounds_public
WITH (security_invoker = true)
AS
SELECT
  id,
  room_id,
  round_number,
  topic,
  secret_word,
  CASE WHEN status = 'completed' THEN impostor_id ELSE NULL END AS impostor_id,
  CASE WHEN status = 'completed' THEN second_impostor_id ELSE NULL END AS second_impostor_id,
  CASE WHEN status = 'completed' THEN impostor_bot_id ELSE NULL END AS impostor_bot_id,
  CASE WHEN status = 'completed' THEN second_impostor_bot_id ELSE NULL END AS second_impostor_bot_id,
  winner,
  status,
  created_at
FROM public.game_rounds;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_profiles;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- ===================== 027: profile customization + feedback =====================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS favorite_pack text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (char_length(bio) <= 160) NOT VALID;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_bio_length;

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text,
  email text,
  category text NOT NULL DEFAULT 'feedback'
    CHECK (category IN ('bug', 'feedback', 'support', 'other')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  page_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback" ON public.feedback
  FOR INSERT
  WITH CHECK (char_length(message) BETWEEN 1 AND 2000);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- ===================== 028: leaderboard visibility =====================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_on_leaderboard boolean NOT NULL DEFAULT true;
