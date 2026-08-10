import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeRound } from "@/lib/game/finalize";
import { getPlayerIdentity } from "@/lib/game/player-identity";
import { isWithinActiveRoomWindow } from "@/lib/rooms/stale";
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

  if (!isWithinActiveRoomWindow(room.updated_at)) {
    await admin.rpc("cleanup_stale_rooms");
    return NextResponse.json(
      { error: "Room expired after 10 minutes of inactivity" },
      { status: 410 }
    );
  }

  if (!room.current_round_id) {
    return NextResponse.json({ error: "No active round" }, { status: 400 });
  }

  const { data: players } = await admin
    .from("room_players")
    .select("id, user_id, bot_id, is_bot")
    .eq("room_id", room.id)
    .returns<RoomPlayer[]>();

  const roomPlayers = players ?? [];
  const isRoomMember = roomPlayers.some((p) => p.user_id === user.id);
  if (!isRoomMember) {
    return NextResponse.json(
      { error: "You are not in this room" },
      { status: 403 }
    );
  }
  const targetPlayer = roomPlayers.find((p) => getPlayerIdentity(p) === votedForId);
  if (!targetPlayer) {
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
    voter_bot_id: null,
    voted_for_id: targetPlayer.user_id,
    voted_for_bot_id: targetPlayer.bot_id,
  });

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  await admin.from("rooms").update({ updated_at: new Date().toISOString() }).eq("id", room.id);

  // Once everyone has voted, close the round out immediately. The voting timer
  // on the clients also calls /resolve, and `finalizeRound` is idempotent, so
  // whichever fires first wins and the rest are harmless no-ops.
  const { count: voteCount } = await admin
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("round_id", room.current_round_id);

  const totalPlayers = roomPlayers.length;
  const totalVotes = voteCount ?? 0;
  const allVoted = totalVotes >= totalPlayers;

  if (allVoted) {
    await finalizeRound(admin, room);
  }

  return NextResponse.json({ success: true, allVoted });
}
