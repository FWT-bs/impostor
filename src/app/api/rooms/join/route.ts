import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveRoomCutoffIso } from "@/lib/rooms/stale";
import {
  LOBBY_AUTO_START_SECONDS,
  MIN_ROOM_PLAYERS,
  isoIn,
  readDeadlines,
  withDeadlines,
} from "@/lib/rooms/deadlines";
import { ensureSeededBotRooms } from "@/lib/bots/seeded-rooms";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];
type RoomWithPlayers = Room & {
  room_players: Pick<RoomPlayer, "id" | "user_id" | "is_bot">[];
};

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

function isSeededRoom(settings: unknown) {
  return Boolean(settings && typeof settings === "object" && (settings as { aiSeeded?: unknown }).aiSeeded === true);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStore }
    );
  }

  const body = await request.json().catch(() => ({}));
  const code: string = (body.code ?? "").toUpperCase().trim();
  const requestedDisplayName: string = body.displayName?.trim() ?? "";

  if (!code || code.length !== 4) {
    return NextResponse.json(
      { error: "Invalid room code" },
      { status: 400, headers: noStore }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500, headers: noStore }
    );
  }
  const { data: room, error: roomError } = await admin
    .from("rooms")
    .select("*, room_players(id, user_id, is_bot)")
    .eq("code", code)
    .eq("status", "waiting")
    .gte("updated_at", getActiveRoomCutoffIso())
    .returns<RoomWithPlayers[]>()
    .maybeSingle();

  if (roomError || !room) {
    return NextResponse.json(
      { error: "Room not found, expired, or game already started" },
      { status: 404, headers: noStore }
    );
  }

  const playerCount = room.room_players?.length ?? 0;
  if (playerCount >= room.max_players) {
    return NextResponse.json(
      { error: "Room is full" },
      { status: 400, headers: noStore }
    );
  }

  const { data: existingPlayer } = await supabase
    .from("room_players")
    .select("id")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .returns<Pick<RoomPlayer, "id">[]>()
    .maybeSingle();

  if (existingPlayer) {
    return NextResponse.json({ room }, { headers: noStore });
  }

  let displayName = requestedDisplayName;
  if (!displayName) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    displayName =
      profile?.username?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      `Player_${user.id.slice(0, 6)}`;
  }

  const hasHumanPlayers = room.room_players?.some((player) => player.user_id && !player.is_bot) ?? false;
  // The first human at a bot table takes the host seat so someone can press
  // start. The room keeps its code and stays listed, so friends who follow the
  // same link land in this very lobby instead of a fresh copy of it.
  const claimsHostSeat = isSeededRoom(room.settings) && !hasHumanPlayers;

  const { error: joinError } = await admin.from("room_players").insert({
    room_id: room.id,
    user_id: user.id,
    display_name: displayName,
    is_host: claimsHostSeat,
    is_ready: claimsHostSeat,
    player_order: playerCount,
  });

  if (joinError) {
    return NextResponse.json(
      { error: joinError.message },
      { status: 500, headers: noStore }
    );
  }

  const nextPlayerCount = playerCount + 1;
  const deadlines = readDeadlines(room.settings);
  const roomUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (claimsHostSeat) roomUpdate.host_id = user.id;

  // Start the lobby countdown as soon as the table is playable. Once it's
  // running we leave it alone, so later joins don't keep pushing it back.
  let settings = room.settings as unknown;
  if (nextPlayerCount >= MIN_ROOM_PLAYERS && !deadlines.startsAt) {
    settings = withDeadlines(settings, { startsAt: isoIn(LOBBY_AUTO_START_SECONDS) });
    roomUpdate.settings = settings;
  }

  await admin.from("rooms").update(roomUpdate).eq("id", room.id);

  // Top the bot tables back up in the background so the browser always has an
  // open one to show, even now that this table has a human in it.
  void ensureSeededBotRooms(admin).catch((error) => {
    console.error("[rooms/join] reseed failed:", error);
  });

  return NextResponse.json(
    { room: { ...room, settings, ...(claimsHostSeat ? { host_id: user.id } : {}) } },
    { headers: noStore },
  );
}
