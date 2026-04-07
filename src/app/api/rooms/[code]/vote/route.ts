import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { determineWinner } from "@/lib/game/engine";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];
type Vote = Database["public"]["Tables"]["votes"]["Row"];
type GameRound = Database["public"]["Tables"]["game_rounds"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

async function ensurePlayerProfile(
  admin: ReturnType<typeof createAdminClient>,
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const votedForId: string = body.votedForId;

  if (!votedForId) {
    return NextResponse.json(
      { error: "Missing votedForId" },
      { status: 400 }
    );
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .returns<Room[]>()
    .maybeSingle();

  if (!room || room.phase !== "voting") {
    return NextResponse.json(
      { error: "Room not in voting phase" },
      { status: 400 }
    );
  }

  if (!room.current_round_id) {
    return NextResponse.json(
      { error: "No active round" },
      { status: 400 }
    );
  }

  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("round_id", room.current_round_id)
    .eq("voter_id", user.id)
    .returns<Vote[]>()
    .maybeSingle();

  if (existingVote) {
    return NextResponse.json(
      { error: "Already voted" },
      { status: 400 }
    );
  }

  const { error: voteError } = await supabase.from("votes").insert({
    round_id: room.current_round_id,
    voter_id: user.id,
    voted_for_id: votedForId,
  });

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  const { data: players } = await admin
    .from("room_players")
    .select("user_id, display_name")
    .eq("room_id", room.id)
    .returns<RoomPlayer[]>();

  const { data: allVotes } = await admin
    .from("votes")
    .select("voter_id, voted_for_id")
    .eq("round_id", room.current_round_id)
    .returns<Vote[]>();

  const totalPlayers = players?.length ?? 0;
  const totalVotes = allVotes?.length ?? 0;

  if (totalVotes >= totalPlayers) {
    const { data: round } = await admin
      .from("game_rounds")
      .select("impostor_id, second_impostor_id")
      .eq("id", room.current_round_id)
      .returns<GameRound[]>()
      .single();

    if (round) {
      const voteMap: Record<string, string> = {};
      for (const v of allVotes!) {
        voteMap[v.voter_id] = v.voted_for_id;
      }
      const impostorIds = [round.impostor_id, round.second_impostor_id].filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      );
      const result = determineWinner(voteMap, impostorIds);

      await admin
        .from("game_rounds")
        .update({ winner: result.winner, status: "completed" })
        .eq("id", room.current_round_id);

      await admin
        .from("rooms")
        .update({ phase: "results" })
        .eq("id", room.id);

      if (players) {
        const isImpostor = (uid: string) => impostorIds.includes(uid);
        for (const p of players) {
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
                (isImpostor(p.user_id) && result.winner === "impostor"
                  ? 1
                  : 0),
              impostor_games:
                profile.impostor_games + (isImpostor(p.user_id) ? 1 : 0),
            })
            .eq("id", p.user_id);
        }
      }
    }
  }

  return NextResponse.json({ success: true, allVoted: totalVotes >= totalPlayers });
}
