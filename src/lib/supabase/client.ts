import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { getSupabaseCookieOptions } from "./cookie-options";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

/**
 * One client for the whole tab.
 *
 * Every call used to build a fresh `createBrowserClient`, and this is called
 * from a dozen components — several of them on each render. Each instance
 * carries its own auth client, and when a signed-in user's token needs
 * refreshing they all contend for the same refresh lock. One instance holds it
 * across a network round trip while the rest queue behind it, so unrelated
 * queries stall together and every list on the page times out at once.
 *
 * Sharing a single instance also means one realtime socket and one token
 * refresh per tab instead of a dozen.
 */
let browserClient: BrowserClient | null = null;

export function createClient(): BrowserClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase project values."
    );
  }

  browserClient = createBrowserClient<Database>(url, key, {
    cookieOptions: getSupabaseCookieOptions(),
  });
  return browserClient;
}
