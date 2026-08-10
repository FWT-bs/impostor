import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeRound } from "@/lib/game/finalize";
import { isWithinActiveRoomWindow } from "@/lib/rooms/stale";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

/**
 * Close out the current voting round. Safe to call from any player in the room
 * and safe to call repeatedly — `finalizeRound` resolves the round at most once.
 *
 * The voting timer on every client calls this when it expires, so a round never
 * gets stuck waiting on a player who left or went idle, even if the host's tab
 * is closed.
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
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStore },
    );
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .returns<Room[]>()
    .maybeSingle();

  if (!room) {
    return NextResponse.json(
      { error: "Room not found" },
      { status: 404, headers: noStore },
    );
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
    return NextResponse.json(
      { error: "You are not in this room" },
      { status: 403, headers: noStore },
    );
  }

  if (room.phase !== "voting") {
    return NextResponse.json(
      { success: true, alreadyResolved: room.phase === "results" },
      { headers: noStore },
    );
  }

  const result = await finalizeRound(admin, room);
  return NextResponse.json({ success: true, ...result }, { headers: noStore });
}
