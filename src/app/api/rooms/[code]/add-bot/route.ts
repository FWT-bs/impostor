import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureBotProfiles } from "@/lib/bots/seeded-rooms";
import {
  LOBBY_AUTO_START_SECONDS,
  MIN_ROOM_PLAYERS,
  isoIn,
  readDeadlines,
  withDeadlines,
} from "@/lib/rooms/deadlines";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

/** Pool of bot names to draw from — same cast used by the pre-seeded public AI tables. */
const BOT_NAME_POOL = ["Nova", "Theo", "Mira", "Jules", "Casey", "Luna"];

function pickBotName(taken: Set<string>): string {
  const free = BOT_NAME_POOL.find((name) => !taken.has(name));
  if (free) return free;
  let n = 2;
  while (taken.has(`${BOT_NAME_POOL[0]} ${n}`)) n++;
  return `${BOT_NAME_POOL[0]} ${n}`;
}

/** Host-only: seat one bot in the next open slot of a lobby that hasn't started yet. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .returns<Room[]>()
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404, headers: noStore });
  }

  if (room.host_id !== user.id) {
    return NextResponse.json({ error: "Only the host can add bots" }, { status: 403, headers: noStore });
  }

  if (room.phase !== "lobby") {
    return NextResponse.json({ error: "Round already started" }, { status: 409, headers: noStore });
  }

  const { data: players } = await admin
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .order("player_order", { ascending: true })
    .returns<RoomPlayer[]>();

  const roomPlayers = players ?? [];
  if (roomPlayers.length >= room.max_players) {
    return NextResponse.json({ error: "Room is full" }, { status: 409, headers: noStore });
  }

  const taken = new Set(roomPlayers.map((p) => p.display_name));
  const name = pickBotName(taken);
  const [bot] = await ensureBotProfiles(admin, [name]);
  if (!bot) {
    return NextResponse.json({ error: "Could not create bot" }, { status: 500, headers: noStore });
  }

  const nextOrder = roomPlayers.reduce((max, p) => Math.max(max, p.player_order), -1) + 1;
  const { error } = await admin.from("room_players").insert({
    room_id: room.id,
    user_id: null,
    bot_id: bot.id,
    is_bot: true,
    display_name: bot.name,
    is_host: false,
    is_ready: true,
    player_order: nextOrder,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  }

  // A bot can be the seat that makes the table playable, so start the lobby
  // countdown here too — not just when a human joins.
  if (roomPlayers.length + 1 >= MIN_ROOM_PLAYERS && !readDeadlines(room.settings).startsAt) {
    await admin
      .from("rooms")
      .update({
        settings: withDeadlines(room.settings, { startsAt: isoIn(LOBBY_AUTO_START_SECONDS) }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);
  }

  return NextResponse.json({ success: true, name: bot.name }, { headers: noStore });
}
