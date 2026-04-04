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

ALTER TABLE public.player_secrets ENABLE ROW LEVEL SECURITY;

-- Players can ONLY see their own secret
CREATE POLICY "Players can only see own secret" ON public.player_secrets
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for regular users — service role only
