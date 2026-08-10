-- Count real lobby/chat activity toward the 10-minute room freshness window.

CREATE OR REPLACE FUNCTION public.touch_room_on_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_room_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_room_id := OLD.room_id;
  ELSE
    target_room_id := NEW.room_id;
  END IF;

  UPDATE public.rooms
  SET updated_at = now()
  WHERE id = target_room_id
    AND status <> 'finished';

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS room_players_touch_room ON public.room_players;
CREATE TRIGGER room_players_touch_room
  AFTER INSERT OR UPDATE OR DELETE ON public.room_players
  FOR EACH ROW EXECUTE FUNCTION public.touch_room_on_activity();

DROP TRIGGER IF EXISTS chat_messages_touch_room ON public.chat_messages;
CREATE TRIGGER chat_messages_touch_room
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_room_on_activity();

REVOKE EXECUTE ON FUNCTION public.touch_room_on_activity() FROM PUBLIC, anon, authenticated;
