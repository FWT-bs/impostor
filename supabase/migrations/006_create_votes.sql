CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voted_for_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(round_id, voter_id)
);

CREATE INDEX idx_votes_round ON public.votes(round_id);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Players can only see votes after the round is complete
CREATE POLICY "Votes visible after round complete" ON public.votes
  FOR SELECT USING (
    round_id IN (
      SELECT id FROM public.game_rounds
      WHERE status = 'completed'
      AND room_id IN (SELECT room_id FROM public.room_players WHERE user_id = auth.uid())
    )
  );

-- Players can insert their own vote (once per round, enforced by UNIQUE)
CREATE POLICY "Players can cast own vote" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);
