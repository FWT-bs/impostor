-- Fix infinite recursion in room_players SELECT policy.
-- The previous policy queried public.room_players from within its own RLS rule.
-- We use a SECURITY DEFINER helper to check membership safely.

CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id uuid)
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

DROP POLICY IF EXISTS "Room members can view players" ON public.room_players;

CREATE POLICY "Room members can view players" ON public.room_players
  FOR SELECT
  USING (
    public.is_room_member(room_id)
    OR room_id IN (
      SELECT id
      FROM public.rooms
      WHERE status = 'waiting'
    )
  );
