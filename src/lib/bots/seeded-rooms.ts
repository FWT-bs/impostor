import { createAdminClient } from "@/lib/supabase/admin";
import { AI_TABLES, getAiTable } from "@/lib/bots/tables";
import { isWithinActiveRoomWindow } from "@/lib/rooms/stale";
import type { Database } from "@/lib/supabase/types";

type AdminClient = ReturnType<typeof createAdminClient>;
type BotProfile = Database["public"]["Tables"]["bot_profiles"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];

const BOT_FALLBACK_COLORS = ["#22c55e", "#facc15", "#ef4444", "#2563eb", "#34d399", "#f97316"];
const SEEDED_ROOM_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const BOT_HOST_USERNAME = "Open Table";
const BOT_HOST_EMAIL = "open-table-bot@imposterlive.local";

type SeededRoom = Room & {
  room_players: Pick<RoomPlayer, "id" | "user_id" | "bot_id" | "is_bot">[];
};

export async function ensureBotProfiles(
  admin: AdminClient,
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

async function ensureBotHost(admin: AdminClient): Promise<string> {
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", BOT_HOST_USERNAME)
    .limit(1)
    .maybeSingle();

  if (existingProfile?.id) return existingProfile.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: BOT_HOST_EMAIL,
    email_confirm: true,
    user_metadata: {
      username: BOT_HOST_USERNAME,
      avatar_color: "#111827",
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Could not create open table host");
  }

  await admin.from("profiles").upsert(
    {
      id: data.user.id,
      username: BOT_HOST_USERNAME,
      avatar_color: "#111827",
    },
    { onConflict: "id" },
  );

  return data.user.id;
}

export async function resetSeededBotRoom(
  admin: AdminClient,
  roomId: string,
  tableId: string,
) {
  const table = getAiTable(tableId);
  if (!table) return;

  const botHostId = await ensureBotHost(admin);
  const bots = await ensureBotProfiles(admin, table.bots);
  if (bots.length < table.bots.length) {
    throw new Error(`Could not restore seeded room ${tableId}`);
  }

  const { data: room } = await admin
    .from("rooms")
    .select("id, current_round_id")
    .eq("id", roomId)
    .returns<Pick<Room, "id" | "current_round_id">[]>()
    .maybeSingle();

  if (!room) return;

  if (room.current_round_id) {
    await Promise.all([
      admin.from("votes").delete().eq("round_id", room.current_round_id),
      admin.from("player_secrets").delete().eq("round_id", room.current_round_id),
      admin.from("game_rounds").delete().eq("id", room.current_round_id),
    ]);
  }

  const desiredBotIds = new Set(bots.map((bot) => bot.id));
  const { data: players } = await admin
    .from("room_players")
    .select("id, bot_id, is_bot")
    .eq("room_id", roomId)
    .returns<Pick<RoomPlayer, "id" | "bot_id" | "is_bot">[]>();

  const staleBotRowIds = (players ?? [])
    .filter((player) => player.is_bot && player.bot_id && !desiredBotIds.has(player.bot_id))
    .map((player) => player.id);

  if (staleBotRowIds.length > 0) {
    await admin.from("room_players").delete().in("id", staleBotRowIds);
  }

  const existingBotIds = new Set(
    (players ?? [])
      .filter((player) => player.is_bot && player.bot_id)
      .map((player) => player.bot_id as string),
  );

  const missingBots = bots.filter((bot) => !existingBotIds.has(bot.id));
  if (missingBots.length > 0) {
    await admin.from("room_players").insert(
      missingBots.map((bot, index) => ({
        room_id: roomId,
        user_id: null,
        bot_id: bot.id,
        is_bot: true,
        display_name: bot.name,
        is_host: false,
        is_ready: true,
        player_order: index,
        clue_text: null,
      })),
    );
  }

  await Promise.all([
    admin.from("room_players").delete().eq("room_id", roomId).eq("is_bot", false),
    ...bots.map((bot, index) =>
      admin
        .from("room_players")
        .update({
          display_name: bot.name,
          is_host: false,
          is_ready: true,
          player_order: index,
          clue_text: null,
        })
        .eq("room_id", roomId)
        .eq("bot_id", bot.id),
    ),
    admin
      .from("rooms")
      .update({
        host_id: botHostId,
        status: "waiting",
        phase: "lobby",
        current_turn_index: 0,
        current_round_id: null,
        max_players: table.maxPlayers,
        settings: {
          ...table.settings,
          aiTable: true,
          aiSeeded: true,
          aiTableId: table.id,
          tableLabel: table.label,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId),
  ]);

  await admin.from("chat_messages").insert({
    room_id: roomId,
    user_id: null,
    display_name: "Game",
    text: `${table.label} is open.`,
  });
}

function isWaitingSeed(room: SeededRoom | null) {
  if (!room) return false;
  // Must actually be status "waiting" — aiSeeded + all-bots alone isn't
  // enough, since a finished/abandoned room keeps that shape too and would
  // otherwise get "touched" (freshness bumped) forever instead of reclaimed.
  if (room.status !== "waiting") return false;
  const players = room.room_players ?? [];
  const settings = room.settings as { aiSeeded?: unknown } | null;
  return settings?.aiSeeded === true && players.every((player) => player.is_bot);
}

export async function ensureSeededBotRooms(admin: AdminClient) {
  const botHostId = await ensureBotHost(admin);

  const ensured: Room[] = [];
  const errors: string[] = [];

  for (const table of AI_TABLES) {
    const bots = await ensureBotProfiles(admin, table.bots);
    if (bots.length < table.bots.length) {
      errors.push(`${table.id}: missing bot profiles`);
      continue;
    }

    // Each table lives at one fixed room code. `code` is unique, so once a
    // room exists there it's ours forever — reclaim and reset it in place
    // rather than trying (and failing) to insert a second room at that code.
    const { data: codeRoom } = await admin
      .from("rooms")
      .select("*, room_players(id, user_id, bot_id, is_bot)")
      .eq("code", table.code)
      .returns<SeededRoom[]>()
      .maybeSingle();

    if (codeRoom) {
      const players = codeRoom.room_players ?? [];
      const hasHuman = players.some((p) => !p.is_bot);
      const fresh = isWithinActiveRoomWindow(codeRoom.updated_at);

      if (hasHuman && fresh) {
        // Someone is actually sitting at (or playing) this table right now —
        // leave it alone. It'll self-heal on the next pass once they're done.
        continue;
      }

      if (isWaitingSeed(codeRoom) && fresh) {
        if (Date.now() - new Date(codeRoom.updated_at).getTime() < SEEDED_ROOM_TOUCH_INTERVAL_MS) {
          ensured.push(codeRoom);
          continue;
        }

        const { data: touched } = await admin
          .from("rooms")
          .update({
            max_players: table.maxPlayers,
            settings: {
              ...table.settings,
              aiTable: true,
              aiSeeded: true,
              aiTableId: table.id,
              tableLabel: table.label,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", codeRoom.id)
          .select("*")
          .returns<Room[]>()
          .single();

        if (touched) ensured.push(touched);
        continue;
      }

      // Finished, abandoned mid-game, or otherwise stale — reclaim it.
      try {
        await resetSeededBotRoom(admin, codeRoom.id, table.id);
        const { data: refreshed } = await admin
          .from("rooms")
          .select("*")
          .eq("id", codeRoom.id)
          .returns<Room[]>()
          .maybeSingle();
        if (refreshed) ensured.push(refreshed);
      } catch (resetError) {
        errors.push(
          `${table.id}: ${resetError instanceof Error ? resetError.message : "reset failed"}`,
        );
      }
      continue;
    }

    const { data: room, error: roomError } = await admin
      .from("rooms")
      .insert({
        code: table.code,
        host_id: botHostId,
        status: "waiting",
        phase: "lobby",
        max_players: table.maxPlayers,
        is_private: false,
        settings: {
          ...table.settings,
          aiTable: true,
          aiSeeded: true,
          aiTableId: table.id,
          tableLabel: table.label,
        },
      })
      .select("*")
      .returns<Room[]>()
      .single();

    if (roomError || !room) {
      errors.push(`${table.id}: ${roomError?.message ?? "room insert returned empty"}`);
      continue;
    }

    const newPlayers = bots.map((bot, index) => ({
      room_id: room.id,
      user_id: null,
      bot_id: bot.id,
      is_bot: true,
      display_name: bot.name,
      is_host: false,
      is_ready: true,
      player_order: index,
    }));

    const { error: playersError } = await admin.from("room_players").insert(newPlayers);
    if (playersError) {
      await admin.from("rooms").delete().eq("id", room.id);
      errors.push(`${table.id}: ${playersError.message}`);
      continue;
    }

    await admin.from("chat_messages").insert({
      room_id: room.id,
      user_id: null,
      display_name: "Game",
      text: `${table.label} is open.`,
    });

    ensured.push(room);
  }

  if (errors.length > 0 && ensured.length === 0) {
    throw new Error(errors.join("; "));
  }

  return ensured;
}
