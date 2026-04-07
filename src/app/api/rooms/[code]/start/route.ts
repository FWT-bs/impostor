import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickWord } from "@/lib/game/words";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];
type GameRound = Database["public"]["Tables"]["game_rounds"]["Row"];

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

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .returns<Room[]>()
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.host_id !== user.id) {
    return NextResponse.json(
      { error: "Only the host can start the game" },
      { status: 403 }
    );
  }

  if (room.status !== "waiting" && room.phase !== "results") {
    return NextResponse.json(
      { error: "Game cannot be started in current state" },
      { status: 400 }
    );
  }

  const { data: players } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .order("player_order", { ascending: true })
    .returns<RoomPlayer[]>();

  if (!players || players.length < 3) {
    return NextResponse.json(
      { error: "Need at least 3 players" },
      { status: 400 }
    );
  }

  const settings = room.settings as { category?: string | null } | null;
  const category = settings?.category ?? null;
  const { entry } = pickWord([], category);

  const impostorIdx = Math.floor(Math.random() * players.length);
  const impostorId = players[impostorIdx].user_id;

  const { data: prevRounds } = await admin
    .from("game_rounds")
    .select("round_number")
    .eq("room_id", room.id)
    .order("round_number", { ascending: false })
    .limit(1)
    .returns<GameRound[]>();

  const roundNumber = (prevRounds?.[0]?.round_number ?? 0) + 1;

  const { data: round, error: roundError } = await admin
    .from("game_rounds")
    .insert({
      room_id: room.id,
      round_number: roundNumber,
      topic: entry.topic,
      secret_word: entry.word,
      impostor_id: impostorId,
      status: "active",
    })
    .select()
    .returns<GameRound[]>()
    .single();

  if (roundError || !round) {
    return NextResponse.json(
      { error: roundError?.message || "Failed to create round" },
      { status: 500 }
    );
  }

  const secrets = players.map((p) => ({
    room_id: room.id,
    round_id: round.id,
    user_id: p.user_id,
    role: p.user_id === impostorId ? "impostor" : "player",
    secret_word: p.user_id === impostorId ? null : entry.word,
    topic: entry.topic,
  }));

  const { error: secretsError } = await admin
    .from("player_secrets")
    .insert(secrets);

  if (secretsError) {
    return NextResponse.json(
      { error: secretsError.message },
      { status: 500 }
    );
  }

  // Reset clues for new round
  await admin
    .from("room_players")
    .update({ clue_text: null })
    .eq("room_id", room.id);

  // Randomize player order
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length; i++) {
    await admin
      .from("room_players")
      .update({ player_order: i })
      .eq("id", shuffled[i].id);
  }

  const { error: roomUpdateError } = await admin
    .from("rooms")
    .update({
      status: "playing",
      phase: "role_reveal",
      current_turn_index: 0,
      current_round_id: round.id,
    })
    .eq("id", room.id);

  if (roomUpdateError) {
    return NextResponse.json(
      { error: roomUpdateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, roundId: round.id });
}
