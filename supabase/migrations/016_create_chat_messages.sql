-- Persistent table chat for online rooms (the redesign's centerpiece).
-- Previously chat was broadcast-only and lost on reload; this stores it so
-- history survives refreshes and late joiners see the conversation.

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL = system/"Game" message
  display_name text NOT NULL,
  text text NOT NULL CHECK (char_length(text) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Room members can read the room's chat history.
CREATE POLICY "Room members can read chat" ON public.chat_messages
  FOR SELECT USING (public.is_room_member(room_id));

-- Room members can post: either as themselves, or a system/"Game" line (NULL user).
CREATE POLICY "Room members can post chat" ON public.chat_messages
  FOR INSERT WITH CHECK (
    public.is_room_member(room_id)
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- Live updates for new messages.
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
