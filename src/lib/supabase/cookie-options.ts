import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Supabase browser client reads the session from `document.cookie`.
 * If cookies are HttpOnly, the client never sees a session → no rest/v1 calls from the browser.
 * Next.js does not force httpOnly, but we set it explicitly so nothing can flip it.
 */
export function getSupabaseCookieOptions(): CookieOptionsWithName {
  const base = {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: false,
    maxAge: 400 * 24 * 60 * 60,
  };

  if (process.env.NODE_ENV === "production") {
    return { ...base, secure: true };
  }

  return base;
}
