-- Tighten Supabase Security Advisor warnings without removing guest play.

-- These helpers exist for RLS recursion avoidance and should not be callable
-- as public RPC endpoints.
REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_waiting_room(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_room_ids() FROM PUBLIC, anon, authenticated;

-- Bot profiles are only needed by signed-in sessions and server-side room code.
DROP POLICY IF EXISTS "Anyone can view bot profiles" ON public.bot_profiles;
CREATE POLICY "Signed-in users can view bot profiles" ON public.bot_profiles
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.bot_profiles FROM anon;
GRANT SELECT ON public.bot_profiles TO authenticated;

-- Chat remains room-member scoped, but no longer exposes public-role policies.
DROP POLICY IF EXISTS "Room members can read chat" ON public.chat_messages;
CREATE POLICY "Room members can read chat" ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND public.is_room_member(room_id)
  );

DROP POLICY IF EXISTS "Room members can post chat" ON public.chat_messages;
CREATE POLICY "Room members can post chat" ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND public.is_room_member(room_id)
    AND (user_id = (SELECT auth.uid()) OR user_id IS NULL)
  );

REVOKE ALL ON public.chat_messages FROM anon;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;

-- Keep avatar public URLs usable, but remove the broad object-listing policy.
-- Signed-in users only get row-level access to their own avatar object.
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Users can view own avatar object" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
