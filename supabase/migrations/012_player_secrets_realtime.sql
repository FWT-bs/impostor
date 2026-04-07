-- Broadcast player_secrets changes so clients can refresh role/word without manual reload.
-- Safe to run once; skip if already in publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'player_secrets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.player_secrets;
  END IF;
END $$;
