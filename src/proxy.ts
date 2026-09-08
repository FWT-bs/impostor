import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const defaults = getSupabaseCookieOptions();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: defaults,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...defaults,
              ...options,
              httpOnly: false,
            })
          );
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value)
            );
          }
        },
      },
    }
  );

  try {
    await supabase.auth.getUser();
  } catch (e) {
    console.error("[proxy] auth.getUser failed:", e);
  }

  // The marketing / informational pages are identical for every visitor and
  // carry no session-specific HTML (the header's auth state is hydrated on the
  // client). Let a CDN cache them so they're fast and cheap to crawl. Every
  // other route keeps the strict no-store policy that auth depends on.
  const path = request.nextUrl.pathname;
  const isPublicContent =
    /^\/(about|contact|privacy|terms|faq|how-to-play|strategy|packs|games-like-spyfall)(\/|$)/.test(
      path
    );

  supabaseResponse.headers.set(
    "Cache-Control",
    isPublicContent
      ? "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
      : "private, no-store, no-cache, max-age=0, must-revalidate"
  );

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
