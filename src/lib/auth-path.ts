/**
 * Safe in-app redirect target (open-redirect hardening).
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (trimmed.includes("://")) return "/";
  return trimmed;
}

export function loginWithNext(currentPathname: string): string {
  const next = safeNextPath(currentPathname);
  if (next === "/login" || next === "/signup") return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}

export function signupWithNext(currentPathname: string): string {
  const next = safeNextPath(currentPathname);
  if (next === "/login" || next === "/signup") return "/signup";
  return `/signup?next=${encodeURIComponent(next)}`;
}
