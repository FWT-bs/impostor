import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" as const };

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.CLEANUP_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get("authorization");
  const cleanupHeader = request.headers.get("x-cleanup-secret");
  return authHeader === `Bearer ${secret}` || cleanupHeader === secret;
}

async function cleanup(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStore },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("cleanup_stale_rooms");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: noStore },
      );
    }

    return NextResponse.json(
      { success: true, result: data },
      { headers: noStore },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500, headers: noStore },
    );
  }
}

export async function GET(request: Request) {
  return cleanup(request);
}

export async function POST(request: Request) {
  return cleanup(request);
}
