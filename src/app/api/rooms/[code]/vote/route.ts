import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeRound } from "@/lib/game/finalize";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];
type Vote = Database["public"]["Tables"]["votes"]["Row"];

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
    return NextResponse.json({ error: "Missing votedForId" }, { status: 400 });
  }

  if (votedForId === user.id) {
    return NextResponse.json(
      { error: "You can't vote for yourself" },
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
    return NextResponse.json({ error: "No active round" }, { status: 400 });
  }

  const { data: players } = await admin
    .from("room_players")
    .select("user_id")
    .eq("room_id", room.id)
    .returns<RoomPlayer[]>();

  const memberIds = new Set((players ?? []).map((p) => p.user_id));
  if (!memberIds.has(user.id)) {
    return NextResponse.json(
      { error: "You are not in this room" },
      { status: 403 }
    );
  }
  if (!memberIds.has(votedForId)) {
    return NextResponse.json(
      { error: "That player is not in this room" },
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
    return NextResponse.json({ error: "Already voted" }, { status: 400 });
  }

  const { error: voteError } = await supabase.from("votes").insert({
    round_id: room.current_round_id,
    voter_id: user.id,
    voted_for_id: votedForId,
  });

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  // Once everyone has voted, close the round out immediately. The voting timer
  // on the clients also calls /resolve, and `finalizeRound` is idempotent, so
  // whichever fires first wins and the rest are harmless no-ops.
  const { count: voteCount } = await admin
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("round_id", room.current_round_id);

  const totalPlayers = memberIds.size;
  const totalVotes = voteCount ?? 0;
  const allVoted = totalVotes >= totalPlayers;

  if (allVoted) {
    await finalizeRound(admin, room);
  }

  return NextResponse.json({ success: true, allVoted });
}
