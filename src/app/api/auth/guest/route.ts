import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

export async function POST() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: noStore }
    );
  }

  return NextResponse.json(
    {
      session: data.session,
      user: data.user,
    },
    { headers: noStore }
  );
}
