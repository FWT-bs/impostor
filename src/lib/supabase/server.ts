import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { getSupabaseCookieOptions } from "./cookie-options";

export async function createClient() {
  const cookieStore = await cookies();
  const defaults = getSupabaseCookieOptions();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: defaults,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...defaults,
                ...options,
                httpOnly: false,
              })
            );
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // The proxy will have already refreshed the session.
          }
        },
      },
    }
  );
}
