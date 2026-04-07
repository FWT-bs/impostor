import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/utils";
import { getPremiumCategories } from "@/lib/game/words";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[rooms/create] auth.getUser error:", authError.message);
  }

  if (!user) {
    console.warn("[rooms/create] No user — returning 401");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedDisplayName: string = body.displayName?.trim() ?? "";
  const maxPlayers: number = Math.min(10, Math.max(3, body.maxPlayers ?? 10));
  const category: string | null = body.category ?? null;
  const isPrivate: boolean = body.isPrivate ?? false;
  const rawTimer = body.discussionTimer;
  const discussionTimer =
    typeof rawTimer === "number" && Number.isFinite(rawTimer)
      ? Math.min(300, Math.max(30, Math.round(rawTimer)))
      : 60;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, is_premium")
    .eq("id", user.id)
    .maybeSingle();

  // Validate premium category access server-side
  if (category) {
    const premiumCats = getPremiumCategories();
    if (premiumCats.has(category) && !profile?.is_premium) {
      return NextResponse.json(
        { error: "Premium subscription required for this category" },
        { status: 403 },
      );
    }
  }

  let displayName = requestedDisplayName;
  if (!displayName) {
    displayName =
      profile?.username?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      `Player_${user.id.slice(0, 6)}`;
  }

  // Try inserting with generated codes — retry on unique constraint collision
  let room: Room | null = null;
  let roomError: { message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        code,
        host_id: user.id,
        status: "waiting",
        phase: "lobby",
        max_players: maxPlayers,
        is_private: isPrivate,
        settings: { discussionTimer, category },
      })
      .select()
      .returns<Room[]>()
      .single();

    if (!error) {
      room = data;
      roomError = null;
      break;
    }
    // 23505 = unique_violation — retry with new code
    if (error.code === "23505") continue;
    roomError = error;
    break;
  }

  if (roomError || !room) {
    console.error("[rooms/create] room insert error:", roomError?.message);
    return NextResponse.json(
      { error: roomError?.message ?? "Failed to create room" },
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
    console.error("[rooms/create] player insert error:", playerError.message);
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
