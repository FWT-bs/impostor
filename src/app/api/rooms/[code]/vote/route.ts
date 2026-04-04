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
    .select("user_id")
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
      .select("impostor_id")
      .eq("id", room.current_round_id)
      .returns<GameRound[]>()
      .single();

    if (round) {
      const voteMap: Record<string, string> = {};
      for (const v of allVotes!) {
        voteMap[v.voter_id] = v.voted_for_id;
      }
      const result = determineWinner(voteMap, round.impostor_id);

      await admin
        .from("game_rounds")
        .update({ winner: result.winner, status: "completed" })
        .eq("id", room.current_round_id);

      await admin
        .from("rooms")
        .update({ phase: "results" })
        .eq("id", room.id);

      if (players) {
        for (const p of players) {
          const isImpostor = p.user_id === round.impostor_id;
          const { data: profile } = await admin
            .from("profiles")
            .select("games_played, group_wins, impostor_wins, impostor_games")
            .eq("id", p.user_id)
            .returns<Profile[]>()
            .single();

          if (profile) {
            await admin
              .from("profiles")
              .update({
                games_played: profile.games_played + 1,
                group_wins:
                  profile.group_wins +
                  (!isImpostor && result.winner === "group" ? 1 : 0),
                impostor_wins:
                  profile.impostor_wins +
                  (isImpostor && result.winner === "impostor" ? 1 : 0),
                impostor_games:
                  profile.impostor_games + (isImpostor ? 1 : 0),
              })
              .eq("id", p.user_id);
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true, allVoted: totalVotes >= totalPlayers });
}
