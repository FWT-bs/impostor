import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Keep browser + server + proxy cookie flags aligned so sessions survive refresh (especially on HTTPS / Vercel).
 */
export function getSupabaseCookieOptions(): CookieOptionsWithName | undefined {
  if (process.env.NODE_ENV !== "production") {
    return { path: "/", sameSite: "lax" };
  }
  return { path: "/", sameSite: "lax", secure: true };
}
