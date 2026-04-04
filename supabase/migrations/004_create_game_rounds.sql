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

ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;

-- Players in the room can see rounds, but impostor_id only after completion
CREATE POLICY "Room members can view rounds" ON public.game_rounds
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM public.room_players WHERE user_id = auth.uid())
  );

-- Only service role inserts rounds (via API routes)
-- No INSERT policy for regular users

-- View that hides impostor_id until round is complete
CREATE VIEW public.game_rounds_public AS
SELECT
  id,
  room_id,
  round_number,
  topic,
  secret_word,
  CASE WHEN status = 'completed' THEN impostor_id ELSE NULL END AS impostor_id,
  winner,
  status,
  created_at
FROM public.game_rounds;
