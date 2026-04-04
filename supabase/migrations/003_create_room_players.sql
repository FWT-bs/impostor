CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  is_ready boolean NOT NULL DEFAULT false,
  is_host boolean NOT NULL DEFAULT false,
  player_order integer NOT NULL DEFAULT 0,
  clue_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_players_room ON public.room_players(room_id);
CREATE INDEX idx_room_players_user ON public.room_players(user_id);

ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view players" ON public.room_players
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM public.room_players rp WHERE rp.user_id = auth.uid())
    OR room_id IN (SELECT id FROM public.rooms WHERE status = 'waiting')
  );

CREATE POLICY "Authenticated users can join rooms" ON public.room_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update own row" ON public.room_players
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can leave rooms" ON public.room_players
  FOR DELETE USING (
    auth.uid() = user_id
    OR room_id IN (SELECT id FROM public.rooms WHERE host_id = auth.uid())
  );
