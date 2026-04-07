import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

/**
 * Server-side email/password sign-in so session cookies are set via Set-Cookie
 * (reliable on refresh). Client-only signInWithPassword often fails to persist across reloads on Vercel.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400, headers: noStore }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: noStore }
    );
  }

  return NextResponse.json(
    { user: data.user, session: data.session },
    { headers: noStore }
  );
}
