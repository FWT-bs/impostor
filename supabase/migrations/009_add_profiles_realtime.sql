-- Leaderboard page subscribes to postgres_changes on public.profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
