import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Called by Supabase cron or an external scheduler.
// Set CLEANUP_SECRET to require the x-cleanup-secret header.
Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("x-cleanup-secret");
  const secret = Deno.env.get("CLEANUP_SECRET");

  if (secret && authHeader !== secret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data, error } = await supabase.rpc("cleanup_stale_rooms");

  if (error) {
    console.error("cleanup_stale_rooms error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("Cleanup result:", data);
  return new Response(JSON.stringify({ success: true, result: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
