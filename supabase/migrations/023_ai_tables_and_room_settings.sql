-- Add transparent AI/practice table support without creating fake auth users.

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
