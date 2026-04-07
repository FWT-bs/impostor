import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const username = String(body.username ?? "").trim();
  const avatar_color = String(body.avatar_color ?? "#06b6d4").trim();

  if (!email || !password || username.length < 2) {
    return NextResponse.json(
      { error: "Valid username, email, and password required" },
      { status: 400, headers: noStore }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400, headers: noStore }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, avatar_color },
    },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: noStore }
    );
  }

  return NextResponse.json(
    {
      user: data.user,
      session: data.session,
    },
    { headers: noStore }
  );
}
