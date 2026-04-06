-- Migration 011: Fix missing columns and RLS policy issues
-- ─────────────────────────────────────────────────────────

-- 1. Add is_private to rooms
--    The rooms/page.tsx queries and sets this column but it was never created.
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

-- 2. Fix handle_new_user trigger to be idempotent.
--    Without ON CONFLICT, a race-condition or retry will throw a duplicate-key
--    error and silently swallow the trigger, leaving the user with no profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player_' || substr(NEW.id::text, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_color', '#06b6d4')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Create a SECURITY DEFINER helper so the rooms SELECT policy can safely
--    check which rooms the current user is in, without going through the
--    room_players RLS (which itself references rooms, causing recursion).
CREATE OR REPLACE FUNCTION public.user_room_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT room_id FROM public.room_players WHERE user_id = auth.uid()
$$;

-- 4. Replace the rooms SELECT policy with one that uses the safe helper.
--    The old policy did:
--      id IN (SELECT room_id FROM public.room_players WHERE user_id = auth.uid())
--    That query triggers room_players RLS which in turn queries rooms → recursion.
DROP POLICY IF EXISTS "Anyone can view waiting rooms" ON public.rooms;

CREATE POLICY "Anyone can view waiting rooms" ON public.rooms
  FOR SELECT USING (
    status = 'waiting'
    OR id IN (SELECT public.user_room_ids())
  );
