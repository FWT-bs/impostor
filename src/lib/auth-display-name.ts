import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Prefer DB profile, then signup metadata (often ready before profiles row),
 * then email local-part.
 */
export function getAuthDisplayName(user: User | null, profile: Profile | null) {
  if (profile?.username?.trim()) return profile.username.trim();
  const meta = user?.user_metadata as
    | { username?: string; preferred_username?: string }
    | undefined;
  const fromMeta =
    meta?.username?.trim() || meta?.preferred_username?.trim();
  if (fromMeta) return fromMeta;
  if (user?.email) return user.email.split("@")[0] ?? "Player";
  return "Player";
}

export function getAuthAvatarColor(user: User | null, profile: Profile | null) {
  if (profile?.avatar_color) return profile.avatar_color;
  const meta = user?.user_metadata as { avatar_color?: string } | undefined;
  if (meta?.avatar_color) return meta.avatar_color;
  return "#8070d4";
}
