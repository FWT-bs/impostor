import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

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
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStore }
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
      { status: 404, headers: noStore }
    );
  }

  const { data: me } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .returns<RoomPlayer[]>()
    .maybeSingle();

  if (!me) {
    return NextResponse.json(
      { error: "You are not in this room. Rejoin with the room code." },
      { status: 400, headers: noStore }
    );
  }

  // Host is always treated as ready; don't toggle host row.
  if (me.is_host) {
    return NextResponse.json(
      { ok: true, is_ready: true },
      { headers: noStore }
    );
  }

  const nextReady = !me.is_ready;
  const { error: updateError } = await supabase
    .from("room_players")
    .update({ is_ready: nextReady })
    .eq("id", me.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500, headers: noStore }
    );
  }

  return NextResponse.json(
    { ok: true, is_ready: nextReady },
    { headers: noStore }
  );
}
