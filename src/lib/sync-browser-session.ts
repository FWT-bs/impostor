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
  const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> =>
    await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms)
      ),
    ]);

  try {
    const {
      data: { session: existing },
    } = await withTimeout(supabase.auth.getSession(), 1200);

    if (existing?.user?.is_anonymous) {
      // Clear guest-only state first, but never block UI navigation on this.
      await withTimeout(supabase.auth.signOut({ scope: "local" }), 1200).catch(
        () => {}
      );
    }

    const { error } = await withTimeout(
      supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
      1500
    );
    if (error) {
      console.warn("[syncBrowserSessionFromApi]", error.message);
    }
  } catch {
    // Best-effort hydration only: route navigation must continue even if
    // browser auth APIs are slow/locked.
  }
}
