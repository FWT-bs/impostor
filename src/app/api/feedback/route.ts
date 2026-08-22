import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = new Set(["bug", "feedback", "support", "other"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json().catch(() => ({}));
  const message: string = typeof body.message === "string" ? body.message.trim() : "";
  const name: string = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const email: string = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  const category: string = CATEGORIES.has(body.category) ? body.category : "feedback";
  const pagePath: string = typeof body.pagePath === "string" ? body.pagePath.slice(0, 200) : "";

  if (!message || message.length > 2000) {
    return NextResponse.json(
      { error: "Message must be between 1 and 2000 characters" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    name: name || null,
    email: email || null,
    category,
    message,
    page_path: pagePath || null,
  });

  if (error) {
    console.error("[feedback] insert error:", error.message);
    return NextResponse.json({ error: "Failed to send. Try again in a moment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
