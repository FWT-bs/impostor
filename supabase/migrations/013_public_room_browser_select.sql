-- Allow browsing public waiting + public in-progress games without being a member,
-- while keeping private lobbies visible only to members (via user_room_ids()).
DROP POLICY IF EXISTS "Anyone can view waiting rooms" ON public.rooms;

CREATE POLICY "Rooms visible in browser or membership" ON public.rooms
  FOR SELECT USING (
    (status = 'waiting' AND is_private = false)
    OR (status = 'playing' AND is_private = false)
    OR id IN (SELECT public.user_room_ids())
  );
