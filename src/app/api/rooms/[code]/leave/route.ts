import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resetSeededBotRoom } from "@/lib/bots/seeded-rooms";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];

function getSeededTableId(settings: unknown) {
  if (!settings || typeof settings !== "object") return null;
  const seeded = (settings as { aiSeeded?: unknown }).aiSeeded === true;
  const tableId = (settings as { aiTableId?: unknown }).aiTableId;
  return seeded && typeof tableId === "string" ? tableId : null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
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

  const { data: room } = await admin
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .returns<Room[]>()
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { data: player } = await admin
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .returns<RoomPlayer[]>()
    .maybeSingle();

  if (!player) {
    return NextResponse.json({ ok: true });
  }

  const seededTableId = getSeededTableId(room.settings);
  await admin.from("room_players").delete().eq("id", player.id);

  const { count: remainingHumans } = await admin
    .from("room_players")
    .select("id", { count: "exact", head: true })
    .eq("room_id", room.id)
    .eq("is_bot", false);

  if (seededTableId && (remainingHumans ?? 0) === 0) {
    await resetSeededBotRoom(admin, room.id, seededTableId);
    return NextResponse.json({ ok: true, reset: true });
  }

  if ((remainingHumans ?? 0) === 0) {
    await admin
      .from("rooms")
      .update({
        status: "finished",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);
  } else if (player.is_host) {
    const { data: nextHost } = await admin
      .from("room_players")
      .select("id, user_id")
      .eq("room_id", room.id)
      .eq("is_bot", false)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextHost?.id && nextHost.user_id) {
      await Promise.all([
        admin.from("room_players").update({ is_host: true }).eq("id", nextHost.id),
        admin.from("rooms").update({ host_id: nextHost.user_id, updated_at: new Date().toISOString() }).eq("id", room.id),
      ]);
    }
  }

  return NextResponse.json({ ok: true });
}
