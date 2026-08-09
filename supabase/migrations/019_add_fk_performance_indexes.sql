-- Cover foreign keys Supabase flags in the performance advisor.

CREATE INDEX IF NOT EXISTS idx_chat_messages_user
  ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_impostor
  ON public.game_rounds(impostor_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_second_impostor
  ON public.game_rounds(second_impostor_id);
CREATE INDEX IF NOT EXISTS idx_player_secrets_room
  ON public.player_secrets(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_host
  ON public.rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter
  ON public.votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_voted_for
  ON public.votes(voted_for_id);
