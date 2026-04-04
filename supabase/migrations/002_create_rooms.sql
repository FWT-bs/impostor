CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code char(4) NOT NULL UNIQUE,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  phase text NOT NULL DEFAULT 'lobby' CHECK (phase IN ('lobby', 'role_reveal', 'clue_phase', 'discussion', 'voting', 'results')),
  current_turn_index integer NOT NULL DEFAULT 0,
  current_round_id uuid,
  settings jsonb NOT NULL DEFAULT '{"discussionTimer": 60, "category": null}'::jsonb,
  max_players integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_code ON public.rooms(code);
CREATE INDEX idx_rooms_status ON public.rooms(status);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see waiting rooms (for the room browser)
CREATE POLICY "Anyone can view waiting rooms" ON public.rooms
  FOR SELECT USING (
    status = 'waiting'
    OR id IN (SELECT room_id FROM public.room_players WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update room" ON public.rooms
  FOR UPDATE USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can delete room" ON public.rooms
  FOR DELETE USING (auth.uid() = host_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
