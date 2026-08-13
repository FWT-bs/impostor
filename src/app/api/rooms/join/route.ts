import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveRoomCutoffIso } from "@/lib/rooms/stale";
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
    const hasHumanHost = room.room_players?.some((player) => player.user_id && !player.is_bot) ?? false;
    if (isSeededRoom(room.settings) && !hasHumanHost) {
      await admin.from("rooms").update({ host_id: user.id }).eq("id", room.id);
      await admin
        .from("room_players")
        .update({ is_host: true, is_ready: true })
        .eq("id", existingPlayer.id);
    }
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
  const shouldClaimSeededTable = isSeededRoom(room.settings) && !hasHumanPlayers;

  const { error: joinError } = await admin.from("room_players").insert({
    room_id: room.id,
    user_id: user.id,
    display_name: displayName,
    is_host: shouldClaimSeededTable,
    is_ready: shouldClaimSeededTable,
    player_order: playerCount,
  });

  if (joinError) {
    return NextResponse.json(
      { error: joinError.message },
      { status: 500, headers: noStore }
    );
  }

  if (shouldClaimSeededTable) {
    await admin.from("rooms").update({ host_id: user.id }).eq("id", room.id);
  }

  return NextResponse.json({ room }, { headers: noStore });
}
