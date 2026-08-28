import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWithinActiveRoomWindow } from "@/lib/rooms/stale";
import {
  CLUE_TURN_SECONDS,
  hasPassed,
  isoIn,
  readDeadlines,
  withDeadlines,
} from "@/lib/rooms/deadlines";
import { clampWholeNumber, type RoomSettings } from "@/lib/rooms/settings";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

/**
 * Advance the room past a timed phase (role reveal -> clue phase, discussion -> voting).
 * Safe to call from any player and safe to call repeatedly — the `.eq("phase", ...)`
 * guard means only the first call for a given phase actually mutates the row.
 *
 * Every client's local countdown calls this when it hits zero (mirroring how
 * `/resolve` closes out voting), so the room never gets stuck waiting on a single
 * client's direct write to Supabase, which may never land if that tab's network
 * to Supabase is slow, backgrounded, or unreachable.
 */
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

  if (!isWithinActiveRoomWindow(room.updated_at)) {
    await admin.rpc("cleanup_stale_rooms");
    return NextResponse.json(
      { error: "Room expired after 10 minutes of inactivity" },
      { status: 410, headers: noStore },
    );
  }

  // Only members may drive the room forward.
  const { data: me } = await supabase
    .from("room_players")
    .select("id")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .returns<{ id: string }[]>()
    .maybeSingle();

  if (!me) {
    return NextResponse.json({ error: "You are not in this room" }, { status: 403, headers: noStore });
  }

  const settings = room.settings as Partial<RoomSettings> | null;

  if (room.phase === "role_reveal") {
    const { error } = await admin
      .from("rooms")
      .update({
        phase: "clue_phase",
        current_turn_index: 0,
        settings: withDeadlines(room.settings, {
          turnEndsAt: isoIn(CLUE_TURN_SECONDS),
          phaseEndsAt: null,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id)
      .eq("phase", "role_reveal");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
    }
    return NextResponse.json({ success: true, phase: "clue_phase" }, { headers: noStore });
  }

  // A clue turn whose clock ran out: record a skipped clue and move on, so one
  // idle player can't hold the whole table.
  if (room.phase === "clue_phase") {
    const { turnEndsAt } = readDeadlines(room.settings);
    if (!hasPassed(turnEndsAt)) {
      return NextResponse.json(
        { success: true, waiting: true, phase: room.phase },
        { headers: noStore },
      );
    }

    const { data: players } = await admin
      .from("room_players")
      .select("*")
      .eq("room_id", room.id)
      .order("player_order", { ascending: true })
      .returns<RoomPlayer[]>();

    if (!players || players.length === 0) {
      return NextResponse.json({ error: "No players found" }, { status: 500, headers: noStore });
    }

    const currentPlayer = players[room.current_turn_index];
    if (currentPlayer && !currentPlayer.clue_text) {
      await admin
        .from("room_players")
        .update({ clue_text: "(no clue)" })
        .eq("id", currentPlayer.id);
    }

    const nextIdx = room.current_turn_index + 1;
    const allDone = nextIdx >= players.length;

    const { error } = await admin
      .from("rooms")
      .update({
        current_turn_index: nextIdx,
        phase: allDone ? "discussion" : "clue_phase",
        settings: withDeadlines(room.settings, {
          turnEndsAt: allDone ? null : isoIn(CLUE_TURN_SECONDS),
          phaseEndsAt: allDone
            ? isoIn(clampWholeNumber(settings?.discussionTimer, 30, 300, 60))
            : null,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id)
      .eq("phase", "clue_phase")
      .eq("current_turn_index", room.current_turn_index);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
    }
    return NextResponse.json(
      { success: true, skipped: true, phase: allDone ? "discussion" : "clue_phase" },
      { headers: noStore },
    );
  }

  if (room.phase === "discussion") {
    const { error } = await admin
      .from("rooms")
      .update({
        phase: "voting",
        settings: withDeadlines(room.settings, {
          turnEndsAt: null,
          phaseEndsAt: isoIn(clampWholeNumber(settings?.votingTimer, 15, 180, 30)),
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id)
      .eq("phase", "discussion");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
    }
    return NextResponse.json({ success: true, phase: "voting" }, { headers: noStore });
  }

  return NextResponse.json({ success: true, alreadyAdvanced: true, phase: room.phase }, { headers: noStore });
}
