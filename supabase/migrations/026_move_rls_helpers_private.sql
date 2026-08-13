-- Move RLS helper calls out of the exposed public API surface.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres;

CREATE OR REPLACE FUNCTION private.is_room_member(p_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_players rp
    WHERE rp.room_id = p_room_id
      AND rp.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION private.is_waiting_room(p_room_id uuid)
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

CREATE OR REPLACE FUNCTION private.user_room_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT rp.room_id
  FROM public.room_players rp
  WHERE rp.user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION private.is_room_member(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_waiting_room(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.user_room_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_room_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_waiting_room(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.user_room_ids() TO anon, authenticated;

DROP POLICY IF EXISTS "Room members can view players" ON public.room_players;
CREATE POLICY "Room members can view players" ON public.room_players
  FOR SELECT
  USING (
    private.is_room_member(room_id)
    OR private.is_waiting_room(room_id)
  );

DROP POLICY IF EXISTS "Rooms visible in browser or membership" ON public.rooms;
CREATE POLICY "Rooms visible in browser or membership" ON public.rooms
  FOR SELECT
  USING (
    (
      is_private = false
      AND updated_at >= now() - interval '10 minutes'
      AND (
        status = 'waiting'
        OR (status = 'playing' AND phase <> 'results')
      )
    )
    OR id IN (SELECT private.user_room_ids())
  );

DROP POLICY IF EXISTS "Room members can read chat" ON public.chat_messages;
CREATE POLICY "Room members can read chat" ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND private.is_room_member(room_id)
  );

DROP POLICY IF EXISTS "Room members can post chat" ON public.chat_messages;
CREATE POLICY "Room members can post chat" ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND private.is_room_member(room_id)
    AND (user_id = (SELECT auth.uid()) OR user_id IS NULL)
  );
