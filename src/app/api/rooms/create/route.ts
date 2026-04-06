import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const displayName: string =
    body.displayName?.trim() || `Player_${user.id.slice(0, 6)}`;
  const maxPlayers: number = Math.min(10, Math.max(3, body.maxPlayers ?? 10));
  const category: string | null = body.category ?? null;
  const isPrivate: boolean = body.isPrivate ?? false;

  let code = generateRoomCode();
  let attempts = 0;

  while (attempts < 10) {
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .returns<Room[]>()
      .maybeSingle();

    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      code,
      host_id: user.id,
      status: "waiting",
      phase: "lobby",
      max_players: maxPlayers,
      is_private: isPrivate,
      settings: { discussionTimer: 60, category },
    })
    .select()
    .returns<Room[]>()
    .single();

  if (roomError) {
    return NextResponse.json(
      { error: roomError.message },
      { status: 500 }
    );
  }

  const { error: playerError } = await supabase.from("room_players").insert({
    room_id: room.id,
    user_id: user.id,
    display_name: displayName,
    is_host: true,
    is_ready: true,
    player_order: 0,
  });

  if (playerError) {
    await supabase.from("rooms").delete().eq("id", room.id);
    return NextResponse.json(
      { error: playerError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { room },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
