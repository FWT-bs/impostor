import { NextResponse } from "next/server";
import { ensureSeededBotRooms } from "@/lib/bots/seeded-rooms";
import { createAdminClient } from "@/lib/supabase/admin";

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };
const SEED_TIMEOUT_MS = 7000;

export async function POST() {
  try {
    const rooms = await Promise.race([
      ensureSeededBotRooms(createAdminClient()),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timed out refreshing tables")), SEED_TIMEOUT_MS);
      }),
    ]);
    return NextResponse.json({ rooms }, { headers: noStore });
  } catch (error) {
    console.error("ensure ai rooms:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not refresh tables" },
      { status: error instanceof Error && error.message.includes("Timed out") ? 504 : 500, headers: noStore },
    );
  }
}
