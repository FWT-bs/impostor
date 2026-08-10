-- Rooms should never look active forever:
-- - waiting rooms older than 10 minutes are deleted
-- - playing/results rooms older than 10 minutes are archived as finished
-- - public browser reads only expose fresh waiting or in-round rooms

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
      AND updated_at >= now() - interval '10 minutes'
  );
$$;

DROP POLICY IF EXISTS "Anyone can view waiting rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view public waiting rooms or own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Rooms visible in browser or membership" ON public.rooms;

CREATE POLICY "Rooms visible in browser or membership" ON public.rooms
  FOR SELECT USING (
    (
      is_private = false
      AND updated_at >= now() - interval '10 minutes'
      AND (
        status = 'waiting'
        OR (status = 'playing' AND phase <> 'results')
      )
    )
    OR id IN (SELECT public.user_room_ids())
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
    DELETE FROM public.rooms
    WHERE status = 'waiting'
      AND updated_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  WITH finished AS (
    UPDATE public.rooms
    SET
      status = 'finished',
      completed_at = COALESCE(completed_at, now())
    WHERE status = 'playing'
      AND updated_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO finished_count FROM finished;

  RETURN jsonb_build_object(
    'deleted_waiting', deleted_count,
    'finished_playing', finished_count,
    'inactive_after_minutes', 10
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_stale_rooms() FROM PUBLIC, anon, authenticated;
