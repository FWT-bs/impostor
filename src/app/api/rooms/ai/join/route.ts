import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAiTable } from "@/lib/bots/tables";
import { generateRoomCode } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type BotProfile = Database["public"]["Tables"]["bot_profiles"]["Row"];

const BOT_FALLBACK_COLORS = ["#22c55e", "#facc15", "#ef4444", "#2563eb", "#34d399", "#f97316"];

async function ensureBotProfiles(
  admin: ReturnType<typeof createAdminClient>,
  names: string[],
): Promise<BotProfile[]> {
  const { data: existing } = await admin
    .from("bot_profiles")
    .select("*")
    .in("name", names)
    .returns<BotProfile[]>();

  const found = new Map((existing ?? []).map((bot) => [bot.name, bot]));
  const missing = names.filter((name) => !found.has(name));

  if (missing.length > 0) {
    const { data: inserted } = await admin
      .from("bot_profiles")
      .insert(
        missing.map((name, index) => ({
          name,
          avatar_color: BOT_FALLBACK_COLORS[index % BOT_FALLBACK_COLORS.length],
          personality: "steady",
        })),
      )
      .select("*")
      .returns<BotProfile[]>();

    for (const bot of inserted ?? []) found.set(bot.name, bot);
  }

  return names
    .map((name) => found.get(name))
    .filter((bot): bot is BotProfile => Boolean(bot));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const table = typeof body.tableId === "string" ? getAiTable(body.tableId) : null;

  if (!table) {
    return NextResponse.json({ error: "AI table not found" }, { status: 404 });
  }

  const requestedDisplayName: string = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const { data: profile } = await admin
    .from("profiles")
    .select("username, avatar_color")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const username =
      requestedDisplayName ||
      user.email?.split("@")[0]?.trim() ||
      `Player_${user.id.slice(0, 6)}`;
    await admin.from("profiles").insert({
      id: user.id,
      username,
      avatar_color: "#22c55e",
    });
  }

  const displayName =
    requestedDisplayName ||
    profile?.username?.trim() ||
    user.email?.split("@")[0]?.trim() ||
    `Player_${user.id.slice(0, 6)}`;

  const bots = await ensureBotProfiles(admin, table.bots);
  if (bots.length < 2) {
    return NextResponse.json({ error: "Could not seat AI players" }, { status: 500 });
  }

  let room: Room | null = null;
  let roomError: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await admin
      .from("rooms")
      .insert({
        code,
        host_id: user.id,
        status: "waiting",
        phase: "lobby",
        max_players: table.maxPlayers,
        is_private: false,
        settings: {
          ...table.settings,
          aiTable: true,
          aiTableId: table.id,
          tableLabel: table.label,
        },
      })
      .select("*")
      .returns<Room[]>()
      .single();

    if (!error) {
      room = data;
      roomError = null;
      break;
    }
    if (error.code === "23505") continue;
    roomError = error;
    break;
  }

  if (roomError || !room) {
    return NextResponse.json(
      { error: roomError?.message ?? "Failed to create AI table" },
      { status: 500 },
    );
  }

  const players = [
    {
      room_id: room.id,
      user_id: user.id,
      bot_id: null,
      is_bot: false,
      display_name: displayName,
      is_host: true,
      is_ready: true,
      player_order: 0,
    },
    ...bots.slice(0, 2).map((bot, index) => ({
      room_id: room.id,
      user_id: null,
      bot_id: bot.id,
      is_bot: true,
      display_name: bot.name,
      is_host: false,
      is_ready: true,
      player_order: index + 1,
    })),
  ];

  const { error: playersError } = await admin.from("room_players").insert(players);
  if (playersError) {
    await admin.from("rooms").delete().eq("id", room.id);
    return NextResponse.json({ error: playersError.message }, { status: 500 });
  }

  await admin.from("chat_messages").insert({
    room_id: room.id,
    user_id: null,
    display_name: "Game",
    text: `${table.label} opened with AI seats. Real players can still join.`,
  });

  return NextResponse.json(
    { room },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
