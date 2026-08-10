import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isWithinActiveRoomWindow } from "@/lib/rooms/stale";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const targetPlayerId: string = body.playerId ?? body.userId;

  if (!targetPlayerId) {
    return NextResponse.json(
      { error: "Missing playerId" },
      { status: 400 }
    );
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id, host_id, updated_at")
    .eq("code", code.toUpperCase())
    .returns<Room[]>()
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (!isWithinActiveRoomWindow(room.updated_at)) {
    return NextResponse.json(
      { error: "Room expired after 10 minutes of inactivity" },
      { status: 410 }
    );
  }

  if (room.host_id !== user.id) {
    return NextResponse.json(
      { error: "Only the host can kick players" },
      { status: 403 }
    );
  }

  const { data: targetPlayer } = await supabase
    .from("room_players")
    .select("id, user_id")
    .eq("room_id", room.id)
    .or(`id.eq.${targetPlayerId},user_id.eq.${targetPlayerId}`)
    .maybeSingle();

  if (!targetPlayer) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  if (targetPlayer.user_id === user.id) {
    return NextResponse.json(
      { error: "Cannot kick yourself" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("room_players")
    .delete()
    .eq("id", targetPlayer.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
