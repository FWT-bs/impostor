import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWithinActiveRoomWindow } from "@/lib/rooms/stale";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

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

  if (room.phase === "role_reveal") {
    const { error } = await admin
      .from("rooms")
      .update({ phase: "clue_phase", current_turn_index: 0 })
      .eq("id", room.id)
      .eq("phase", "role_reveal");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
    }
    return NextResponse.json({ success: true, phase: "clue_phase" }, { headers: noStore });
  }

  if (room.phase === "discussion") {
    const { error } = await admin
      .from("rooms")
      .update({ phase: "voting" })
      .eq("id", room.id)
      .eq("phase", "discussion");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
    }
    return NextResponse.json({ success: true, phase: "voting" }, { headers: noStore });
  }

  return NextResponse.json({ success: true, alreadyAdvanced: true, phase: room.phase }, { headers: noStore });
}
