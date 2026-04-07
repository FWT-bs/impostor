-- Optional second impostor for 6+ player games.
ALTER TABLE public.game_rounds
  ADD COLUMN IF NOT EXISTS second_impostor_id uuid REFERENCES public.profiles(id);

DROP VIEW IF EXISTS public.game_rounds_public;
CREATE VIEW public.game_rounds_public AS
SELECT
  id,
  room_id,
  round_number,
  topic,
  secret_word,
  CASE WHEN status = 'completed' THEN impostor_id ELSE NULL END AS impostor_id,
  CASE WHEN status = 'completed' THEN second_impostor_id ELSE NULL END AS second_impostor_id,
  winner,
  status,
  created_at
FROM public.game_rounds;
