export type PlayerIdentityLike = {
  id: string;
  user_id: string | null;
  bot_id?: string | null;
  is_bot?: boolean;
};

export function getPlayerIdentity(player: PlayerIdentityLike): string {
  return player.user_id ?? player.bot_id ?? player.id;
}

export function getVoterIdentity(vote: {
  voter_id?: string | null;
  voter_bot_id?: string | null;
}): string | null {
  return vote.voter_id ?? vote.voter_bot_id ?? null;
}

export function getVoteTargetIdentity(vote: {
  voted_for_id?: string | null;
  voted_for_bot_id?: string | null;
}): string | null {
  return vote.voted_for_id ?? vote.voted_for_bot_id ?? null;
}

export function isBotPlayer(player: PlayerIdentityLike): boolean {
  return Boolean(player.is_bot && player.bot_id && !player.user_id);
}

export function isHumanPlayer(player: PlayerIdentityLike): boolean {
  return Boolean(player.user_id && !player.is_bot);
}
