import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const targetUserId: string = body.userId;

  if (!targetUserId) {
    return NextResponse.json(
      { error: "Missing userId" },
      { status: 400 }
    );
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id, host_id")
    .eq("code", code.toUpperCase())
    .returns<Room[]>()
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.host_id !== user.id) {
    return NextResponse.json(
      { error: "Only the host can kick players" },
      { status: 403 }
    );
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: "Cannot kick yourself" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("room_players")
    .delete()
    .eq("room_id", room.id)
    .eq("user_id", targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
