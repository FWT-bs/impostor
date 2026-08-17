import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

/** Send a finished room back to its lobby so the table can set up another round. */
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

  const { error } = await admin
    .from("rooms")
    .update({ status: "waiting", phase: "lobby" })
    .eq("id", room.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  }

  return NextResponse.json({ success: true }, { headers: noStore });
}
