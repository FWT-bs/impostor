-- Keep a fresh local Supabase reset aligned with the hosted project.
-- Hosted already has these pieces; this migration is intentionally idempotent.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_stripe_customer_id_key'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_stripe_customer_id_key UNIQUE (stripe_customer_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_rooms_status_private
  ON public.rooms(status, is_private);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at
  ON public.rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_updated_at
  ON public.rooms(updated_at DESC);

CREATE OR REPLACE FUNCTION public.is_waiting_room(p_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rooms
    WHERE id = p_room_id
      AND status = 'waiting'
  );
$$;

DROP POLICY IF EXISTS "Room members can view players" ON public.room_players;

CREATE POLICY "Room members can view players" ON public.room_players
  FOR SELECT
  USING (
    public.is_room_member(room_id)
    OR public.is_waiting_room(room_id)
  );

CREATE OR REPLACE FUNCTION public.cleanup_stale_rooms()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count integer;
  finished_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM rooms
    WHERE status = 'waiting'
      AND updated_at < now() - interval '30 minutes'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  WITH updated AS (
    UPDATE rooms
    SET status = 'finished', completed_at = now()
    WHERE status = 'playing'
      AND updated_at < now() - interval '30 minutes'
    RETURNING id
  )
  SELECT count(*) INTO finished_count FROM updated;

  RETURN jsonb_build_object(
    'deleted_waiting', deleted_count,
    'finished_playing', finished_count
  );
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
