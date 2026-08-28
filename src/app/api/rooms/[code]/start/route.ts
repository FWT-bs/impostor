import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickWord } from "@/lib/game/words";
import { getPlayerIdentity } from "@/lib/game/player-identity";
import { resolveImpostorCount, type RoomSettings } from "@/lib/rooms/settings";
import { isWithinActiveRoomWindow } from "@/lib/rooms/stale";
import {
  MIN_ROOM_PLAYERS,
  hasPassed,
  readDeadlines,
  withDeadlines,
} from "@/lib/rooms/deadlines";
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

  if (!isWithinActiveRoomWindow(room.updated_at)) {
    await admin.rpc("cleanup_stale_rooms");
    return NextResponse.json(
      { error: "Room expired after 10 minutes of inactivity" },
      { status: 410 }
    );
  }

  if (room.status !== "waiting" && room.phase !== "results") {
    // Already running — an expired-countdown poke from a second client is
    // normal here, so don't treat it as an error.
    return NextResponse.json(
      { ok: true, alreadyStarted: true },
      { status: 200 }
    );
  }

  const { data: players } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .order("player_order", { ascending: true })
    .returns<RoomPlayer[]>();

  if (!players || players.length < MIN_ROOM_PLAYERS) {
    return NextResponse.json(
      { error: `Need at least ${MIN_ROOM_PLAYERS} players` },
      { status: 400 }
    );
  }

  // Anyone at the table may start it once the lobby countdown has run out or
  // every human is ready. Outside those windows it stays the host's call.
  const humans = players.filter((player) => !player.is_bot);
  const everyoneReady =
    humans.length > 0 && humans.every((player) => player.is_ready || player.is_host);
  const countdownDone = hasPassed(readDeadlines(room.settings).startsAt);
  const isMember = players.some((player) => player.user_id === user.id);

  if (room.host_id !== user.id && !(isMember && (everyoneReady || countdownDone))) {
    return NextResponse.json(
      { error: "Only the host can start the game" },
      { status: 403 }
    );
  }

  const settings = room.settings as Partial<RoomSettings> | null;
  const category = settings?.category ?? null;
  const { entry } = pickWord([], category);

  const nImpostors = resolveImpostorCount(players.length, settings?.impostorCount);
  const impostorPickOrder = [...players].sort(() => Math.random() - 0.5);
  const primaryImpostor = impostorPickOrder[0];
  const secondImpostor = nImpostors === 2 ? impostorPickOrder[1] : null;
  const impostorId = primaryImpostor.user_id;
  const impostorBotId = primaryImpostor.bot_id;
  const secondImpostorId = secondImpostor?.user_id ?? null;
  const secondImpostorBotId = secondImpostor?.bot_id ?? null;

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
      impostor_bot_id: impostorBotId,
      second_impostor_id: secondImpostorId,
      second_impostor_bot_id: secondImpostorBotId,
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

  const impostorSet = new Set([primaryImpostor, secondImpostor].filter(Boolean).map((p) => getPlayerIdentity(p as RoomPlayer)));
  const secrets = players.map((p) => ({
    room_id: room.id,
    round_id: round.id,
    user_id: p.user_id,
    bot_id: p.bot_id,
    is_bot: p.is_bot,
    role: impostorSet.has(getPlayerIdentity(p)) ? "impostor" : "player",
    secret_word: impostorSet.has(getPlayerIdentity(p)) ? null : entry.word,
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

  // Randomize player order and reset clues in parallel batched updates
  const turnOrder = [...players].sort(() => Math.random() - 0.5);
  await Promise.all(
    turnOrder.map((p, i) =>
      admin
        .from("room_players")
        .update({ player_order: i, clue_text: null })
        .eq("id", p.id)
    )
  );

  const { error: roomUpdateError } = await admin
    .from("rooms")
    .update({
      status: "playing",
      phase: "role_reveal",
      current_turn_index: 0,
      current_round_id: round.id,
      // Clear the lobby countdown; the clue turn gets its own clock once the
      // table moves past role reveal.
      settings: withDeadlines(room.settings, {
        startsAt: null,
        turnEndsAt: null,
        phaseEndsAt: null,
      }),
      updated_at: new Date().toISOString(),
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
