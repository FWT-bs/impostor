-- Move stale-room cleanup scheduling from Vercel Cron to Supabase Cron.
-- This keeps the 5-minute cleanup cadence on Vercel Hobby deployments.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

SELECT cron.schedule(
  'cleanup-stale-rooms',
  '*/5 * * * *',
  $$
    SELECT public.cleanup_stale_rooms();
  $$
);
