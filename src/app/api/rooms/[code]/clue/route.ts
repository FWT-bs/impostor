import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const clueText: string = (body.clue ?? "").trim();

  if (!clueText || clueText.length > 200) {
    return NextResponse.json(
      { error: "Clue must be 1-200 characters" },
      { status: 400 }
    );
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .returns<Room[]>()
    .maybeSingle();

  if (!room || room.phase !== "clue_phase") {
    return NextResponse.json(
      { error: "Room not in clue phase" },
      { status: 400 }
    );
  }

  const { data: players } = await admin
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .order("player_order", { ascending: true })
    .returns<RoomPlayer[]>();

  if (!players) {
    return NextResponse.json({ error: "No players found" }, { status: 500 });
  }

  const currentPlayer = players[room.current_turn_index];
  if (!currentPlayer || currentPlayer.user_id !== user.id) {
    return NextResponse.json(
      { error: "Not your turn" },
      { status: 403 }
    );
  }

  await admin
    .from("room_players")
    .update({ clue_text: clueText })
    .eq("id", currentPlayer.id);

  const nextIdx = room.current_turn_index + 1;
  const allDone = nextIdx >= players.length;

  await admin
    .from("rooms")
    .update({
      current_turn_index: nextIdx,
      phase: allDone ? "discussion" : "clue_phase",
    })
    .eq("id", room.id);

  return NextResponse.json({ success: true, allDone });
}
