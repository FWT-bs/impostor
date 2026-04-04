CREATE OR REPLACE FUNCTION public.increment_stats(
  p_user_id uuid,
  p_is_impostor boolean,
  p_winner text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET
    games_played = games_played + 1,
    group_wins = group_wins + CASE WHEN NOT p_is_impostor AND p_winner = 'group' THEN 1 ELSE 0 END,
    impostor_wins = impostor_wins + CASE WHEN p_is_impostor AND p_winner = 'impostor' THEN 1 ELSE 0 END,
    impostor_games = impostor_games + CASE WHEN p_is_impostor THEN 1 ELSE 0 END
  WHERE id = p_user_id;
END;
$$;
