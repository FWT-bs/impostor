import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * After `/api/auth/*` sets cookies on the response, the Supabase browser client
 * should read them — but cookie chunking / timing on full navigation can still
 * leave `getUser()` empty. Mirroring the session into the client guarantees the
 * singleton sees the same JWT as the server on the *current* document before
 * `location.assign`, so `/profile` and `/rooms` don't think you're logged out.
 */
export async function syncBrowserSessionFromApi(
  session: Session | null | undefined
): Promise<void> {
  if (!session?.access_token || !session.refresh_token) return;
  const supabase = createClient();
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) {
    console.warn("[syncBrowserSessionFromApi]", error.message);
  }
}
