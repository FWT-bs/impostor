-- Harden the activity trigger for DELETE events, where NEW is not available.

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

REVOKE EXECUTE ON FUNCTION public.touch_room_on_activity() FROM PUBLIC, anon, authenticated;
