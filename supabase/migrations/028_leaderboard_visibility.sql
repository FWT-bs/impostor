-- Lets a player opt out of the public leaderboard without deleting their stats.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_on_leaderboard boolean NOT NULL DEFAULT true;
