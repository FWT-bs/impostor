import { determineWinner } from "@/lib/game/engine";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type Admin = ReturnType<typeof createAdminClient>;
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];
type Vote = Database["public"]["Tables"]["votes"]["Row"];
type GameRound = Database["public"]["Tables"]["game_rounds"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Make sure a profile row exists before we increment stats (guests may not have one yet). */
async function ensurePlayerProfile(
  admin: Admin,
  userId: string,
  displayName: string,
) {
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return;
  const username =
    displayName.trim().replace(/\s+/g, "_").slice(0, 24) ||
    `Player_${userId.slice(0, 8)}`;
  await admin.from("profiles").insert({
    id: userId,
    username,
    avatar_color: "#06b6d4",
    games_played: 0,
    group_wins: 0,
    impostor_wins: 0,
    impostor_games: 0,
  });
}

export type FinalizeResult = {
  /** True only for the single caller that actually closed the round. */
  resolved: boolean;
  /** True if the round was already completed by someone else (or had no votes claim). */
  alreadyResolved: boolean;
};

/**
 * Tally the votes for the room's current round, decide the winner, move the room
 * to `results`, and award stats — exactly once.
 *
 * Resolution is concurrency-safe: many clients (every voter, plus the voting
 * timer on each device) may call this at the same moment. We flip the round
 * `status` from `active` → `completed` with a guarded UPDATE, and only the caller
 * whose UPDATE actually matched a row proceeds to write room phase + stats. This
 * removes both the "game stuck in voting" deadlock and the double-counted-stats
 * race that the old inline resolution had.
 */
export async function finalizeRound(
  admin: Admin,
  room: Room,
): Promise<FinalizeResult> {
  const roundId = room.current_round_id;
  if (!roundId) return { resolved: false, alreadyResolved: false };

  const [{ data: round }, { data: allVotes }, { data: players }] =
    await Promise.all([
      admin
        .from("game_rounds")
        .select("impostor_id, second_impostor_id, status")
        .eq("id", roundId)
        .returns<GameRound[]>()
        .maybeSingle(),
      admin
        .from("votes")
        .select("voter_id, voted_for_id")
        .eq("round_id", roundId)
        .returns<Vote[]>(),
      admin
        .from("room_players")
        .select("user_id, display_name")
        .eq("room_id", room.id)
        .returns<RoomPlayer[]>(),
    ]);

  if (!round) return { resolved: false, alreadyResolved: false };
  if (round.status === "completed") {
    return { resolved: false, alreadyResolved: true };
  }

  const voteMap: Record<string, string> = {};
  for (const v of allVotes ?? []) {
    voteMap[v.voter_id] = v.voted_for_id;
  }
  const impostorIds = [round.impostor_id, round.second_impostor_id].filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
  const result = determineWinner(voteMap, impostorIds);

  // Atomic claim — only the first caller to flip active→completed wins the race.
  const { data: claimed } = await admin
    .from("game_rounds")
    .update({ winner: result.winner, status: "completed" })
    .eq("id", roundId)
    .eq("status", "active")
    .select("id")
    .returns<{ id: string }[]>()
    .maybeSingle();

  if (!claimed) return { resolved: false, alreadyResolved: true };

  await admin.from("rooms").update({ phase: "results" }).eq("id", room.id);

  const isImpostor = (uid: string) => impostorIds.includes(uid);
  for (const p of players ?? []) {
    await ensurePlayerProfile(admin, p.user_id, p.display_name);
    const { data: profile } = await admin
      .from("profiles")
      .select("games_played, group_wins, impostor_wins, impostor_games")
      .eq("id", p.user_id)
      .returns<Profile[]>()
      .maybeSingle();
    if (!profile) continue;

    await admin
      .from("profiles")
      .update({
        games_played: profile.games_played + 1,
        group_wins:
          profile.group_wins +
          (!isImpostor(p.user_id) && result.winner === "group" ? 1 : 0),
        impostor_wins:
          profile.impostor_wins +
          (isImpostor(p.user_id) && result.winner === "impostor" ? 1 : 0),
        impostor_games: profile.impostor_games + (isImpostor(p.user_id) ? 1 : 0),
      })
      .eq("id", p.user_id);
  }

  return { resolved: true, alreadyResolved: false };
}
