-- Stored total wins for leaderboard ordering (group_wins + impostor_wins).
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_wins integer
GENERATED ALWAYS AS (group_wins + impostor_wins) STORED;
