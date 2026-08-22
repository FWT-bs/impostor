"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { TopicPackChip } from "@/components/game";
import { getCategories } from "@/lib/game/words";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { loginWithNext } from "@/lib/auth-path";
import { setPreferredDisplayName } from "@/lib/preferred-display-name";
import { cn } from "@/lib/utils";
import Link from "next/link";

const BIO_MAX_LENGTH = 160;

const AVATAR_COLORS = [
  "#1155f6", "#ef493a", "#f4b218", "#15925f", "#7ac4ad",
  "#8a67d4", "#f27a3d", "#1e9bd1", "#f16d9d", "#0f6f58",
];

const statConfig = [
  { key: "games_played" as const, label: "Games Played", color: "" },
  { key: "winRate" as const, label: "Win Rate", color: "text-brand-2" },
  { key: "group_wins" as const, label: "Group Wins", color: "text-emerald" },
  { key: "impostor_wins" as const, label: "Impostor Wins", color: "text-rose" },
  { key: "impostor_games" as const, label: "Times Impostor", color: "" },
  { key: "impostorWinRate" as const, label: "Impostor Win Rate", color: "text-orange" },
];

function PageSpinner({ label }: { label: string }) {
  return (
    <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 relative z-10">
        <svg className="size-8 animate-spin text-brand/60" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, signOut, refreshAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [favoritePack, setFavoritePack] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState("");
  const [recoveryColor, setRecoveryColor] = useState("#1155f6");
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(loginWithNext(pathname));
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const meta = user.user_metadata as { username?: string; avatar_color?: string } | undefined;
    const fromMeta = meta?.username?.trim();
    const fallbackName =
      fromMeta || user.email?.split("@")[0]?.trim() || `Player_${user.id.slice(0, 6)}`;
    const c = meta?.avatar_color?.trim();
    queueMicrotask(() => {
      if (cancelled) return;
      setRecoveryUsername(fallbackName);
      if (c) setRecoveryColor(c);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleCreateMissingProfile = useCallback(async () => {
    if (!user) return;
    setCreatingProfile(true);
    const supabase = createClient();
    const uname =
      recoveryUsername.trim() || `Player_${user.id.slice(0, 6)}`;
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      username: uname,
      avatar_color: recoveryColor,
    });
    setCreatingProfile(false);
    if (error) {
      if (error.code === "23505") {
        await refreshAuth();
        toast.success("Profile linked");
        return;
      }
      toast.error(error.message);
      return;
    }
    setPreferredDisplayName(uname);
    await refreshAuth();
    toast.success("Profile created");
  }, [user, recoveryUsername, recoveryColor, refreshAuth]);

  if (loading) {
    return (
      <>
        <Header />
        <PageSpinner label="Loading profile..." />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <PageSpinner label="Redirecting..." />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header
          user={{
            username: recoveryUsername || "Player",
            avatarColor: recoveryColor,
          }}
        />
        <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
          <div className="mx-auto max-w-2xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <p className="text-[10px] uppercase text-muted/60 mb-3">
                Agent record
              </p>
              <h1 className="font-display text-4xl text-foreground mb-2">Finish setup</h1>
              <p className="text-sm text-muted max-w-md mx-auto">
                You&apos;re signed in, but there&apos;s no player row in the database yet (often a missed trigger).
                Create your profile here with the same permissions as normal signup.
              </p>
            </motion.div>
            <Card padding="lg" className="border-2 border-border">
              <Input
                label="Username"
                value={recoveryUsername}
                onChange={(e) => setRecoveryUsername(e.target.value)}
                className="mb-4"
              />
              <label className="block text-sm font-semibold text-foreground mb-2">
                Avatar color
              </label>
              <div className="flex gap-2 flex-wrap mb-6">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setRecoveryColor(c)}
                    className={cn(
                      "size-9 rounded-lg transition-colors duration-150 cursor-pointer",
                      recoveryColor === c
                        ? "ring-2 ring-brand"
                        : "ring-1 ring-transparent hover:ring-border-2",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="primary" className="sm:flex-1" onClick={handleCreateMissingProfile} isLoading={creatingProfile}>
                  Create profile
                </Button>
                <Button variant="secondary" className="sm:flex-1" onClick={() => void refreshAuth()}>
                  I already have one. Refresh
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const activeUser = user;
  const activeProfile = profile;

  function startEdit() {
    setUsername(activeProfile.username);
    setSelectedColor(activeProfile.avatar_color);
    setBio(activeProfile.bio ?? "");
    setPronouns(activeProfile.pronouns ?? "");
    setFavoritePack(activeProfile.favorite_pack ?? null);
    setEditing(true);
  }

  async function handleSave() {
    const nextUsername = username.trim();
    if (nextUsername.length < 2) {
      toast.error("Username must be at least 2 characters");
      return;
    }
    const nextBio = bio.trim();
    if (nextBio.length > BIO_MAX_LENGTH) {
      toast.error(`Bio must be ${BIO_MAX_LENGTH} characters or fewer`);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        username: nextUsername,
        avatar_color: selectedColor,
        bio: nextBio,
        pronouns: pronouns.trim() || null,
        favorite_pack: favoritePack,
      })
      .eq("id", activeUser.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPreferredDisplayName(nextUsername);
    toast.success("Profile updated");
    setEditing(false);
    await refreshAuth();
  }

  async function handleToggleLeaderboardVisibility() {
    setTogglingVisibility(true);
    const supabase = createClient();
    const next = !activeProfile.show_on_leaderboard;
    const { error } = await supabase
      .from("profiles")
      .update({ show_on_leaderboard: next })
      .eq("id", activeUser.id);
    setTogglingVisibility(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? "You're back on the leaderboard" : "Hidden from the leaderboard");
    await refreshAuth();
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${activeUser.id}/avatar.${ext}`;

    // Remove old avatar if exists
    await supabase.storage.from("avatars").remove([path]);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", activeUser.id);

    setUploading(false);
    if (profileError) {
      toast.error(profileError.message);
      return;
    }
    toast.success("Avatar uploaded");
    await refreshAuth();
  }

  function handleRemoveAvatar() {
    const supabase = createClient();
    supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", activeUser.id)
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Avatar removed");
        void refreshAuth();
      });
  }

  const totalWins = activeProfile.total_wins;
  const winRate =
    activeProfile.games_played > 0
      ? Math.round((totalWins / activeProfile.games_played) * 100)
      : 0;
  const impostorWinRate =
    activeProfile.impostor_games > 0
      ? Math.round(
          (activeProfile.impostor_wins / activeProfile.impostor_games) * 100
        )
      : 0;

  function getStatValue(key: (typeof statConfig)[number]["key"]): string | number {
    if (key === "winRate") return `${winRate}%`;
    if (key === "impostorWinRate") return `${impostorWinRate}%`;
    return (activeProfile[key as keyof typeof activeProfile] as number) ?? 0;
  }

  return (
    <>
      <Header
        user={{
          username: activeProfile.username,
          avatarColor: activeProfile.avatar_color,
          avatarUrl: activeProfile.avatar_url,
        }}
      />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-5 pt-28 pb-16">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 text-center"
          >
            <div className="mb-3 flex justify-center"><Chip tone="brand" icon="users">Your record</Chip></div>
            <h1 className="display mb-2" style={{ fontSize: 56 }}>PROFILE</h1>
            <p className="mx-auto max-w-md text-sm text-muted">
              Your alias, colors, and stats carry into online matches and the leaderboard.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card padding="lg" className="text-center mb-6 border border-border">
              <motion.div
                initial={{ scale: 0.88 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="relative inline-block"
              >
                <Avatar
                  name={activeProfile.username}
                  color={activeProfile.avatar_color}
                  imageUrl={activeProfile.avatar_url}
                  size="lg"
                  className="mx-auto mb-4 !size-24 !text-3xl"
                />
                {/* Upload overlay */}
                <label
                  className={cn(
                    "absolute inset-0 mb-4 flex items-center justify-center rounded-full cursor-pointer",
                    "bg-black/0 hover:bg-black/50 transition-all duration-200 group",
                  )}
                >
                  <svg
                    className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <input
                    id="profile-avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </motion.div>
              {uploading && (
                <p className="text-xs text-brand-2 mb-2">Uploading...</p>
              )}
              {activeProfile.avatar_url && !uploading && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs text-muted hover:text-rose transition-colors cursor-pointer mb-2"
                >
                  Remove photo
                </button>
              )}
              {!uploading && (
                <div className="mb-3 mt-1 flex justify-center">
                  <Button variant="secondary" size="sm" asChild>
                    <label htmlFor="profile-avatar-upload">
                      {activeProfile.avatar_url ? "Change photo" : "Upload photo"}
                    </label>
                  </Button>
                </div>
              )}
              <h2 className="font-display text-3xl text-foreground mb-1 flex items-center justify-center gap-2 flex-wrap">
                {activeProfile.username}
                {activeProfile.pronouns && (
                  <span className="text-sm font-normal text-muted">({activeProfile.pronouns})</span>
                )}
              </h2>
              <p className="text-sm text-muted mb-1">
                {activeUser.is_anonymous ? "Guest operative" : activeUser.email}
              </p>
              {activeProfile.bio && (
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground/85">
                  {activeProfile.bio}
                </p>
              )}
              {activeProfile.favorite_pack && (
                <div className="mt-3 flex justify-center">
                  <Chip tone="brand" icon="dice">Favorite pack: {activeProfile.favorite_pack}</Chip>
                </div>
              )}
              {!editing && (
                <Button variant="secondary" size="sm" className="mt-4" onClick={startEdit}>
                  Edit profile
                </Button>
              )}
            </Card>

            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="mb-6"
              >
                <Card padding="lg" className="border-2 border-border">
                  <h3 className="font-display text-lg text-foreground mb-4">Customize</h3>
                  <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mb-4"
                  />
                  <Input
                    label="Pronouns (optional)"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="e.g. they/them"
                    maxLength={30}
                    className="mb-4"
                  />
                  <Textarea
                    label="Bio (optional)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the table something about yourself"
                    maxLength={BIO_MAX_LENGTH}
                    rows={3}
                    className="mb-4"
                  />
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Avatar color
                  </label>
                  <p className="text-xs text-muted mb-3">
                    Used as fallback when no profile picture is set.
                  </p>
                  <div className="flex gap-2 flex-wrap mb-5">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={cn(
                          "size-9 rounded-lg transition-colors duration-150 cursor-pointer",
                          selectedColor === c
                            ? "ring-2 ring-brand"
                            : "ring-1 ring-transparent hover:ring-border-2",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Favorite pack
                  </label>
                  <p className="text-xs text-muted mb-3">
                    Shown as a badge on your profile. Purely cosmetic.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {getCategories().map((pack) => (
                      <TopicPackChip
                        key={pack}
                        name={pack}
                        selected={favoritePack === pack}
                        onClick={() => setFavoritePack(favoritePack === pack ? null : pack)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" className="flex-1" onClick={handleSave} isLoading={saving}>
                      Save
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Settings */}
            <Card padding="lg" className="mb-6 border-2 border-border">
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className="w-full flex items-center justify-between cursor-pointer"
              >
                <h3 className="font-display text-xl text-foreground">Settings</h3>
                <motion.svg
                  className="size-5 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  animate={{ rotate: settingsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </motion.svg>
              </button>
              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5 space-y-4">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card-hover/50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Account type</p>
                          <p className="text-xs text-muted mt-0.5">
                            {activeUser.is_anonymous ? "Guest. Sign up to keep your stats" : "Full account"}
                          </p>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border",
                          activeUser.is_anonymous
                            ? "border-orange/30 text-orange bg-orange/10"
                            : "border-emerald/30 text-emerald bg-emerald/10"
                        )}>
                          {activeUser.is_anonymous ? "Guest" : "Verified"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border bg-card-hover/50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Email</p>
                          <p className="text-xs text-muted mt-0.5">
                            {activeUser.is_anonymous ? "Not set" : activeUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border bg-card-hover/50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Member since</p>
                          <p className="text-xs text-muted mt-0.5">
                            {new Date(activeProfile.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border bg-card-hover/50 px-4 py-3"
                        style={{
                          borderColor: activeProfile.is_premium
                            ? "color-mix(in oklab, var(--brand) 35%, transparent)"
                            : "var(--border)",
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">Subscription</p>
                          <p className="text-xs text-muted mt-0.5">
                            {activeProfile.is_premium
                              ? `Premium${activeProfile.premium_until ? ` - renews ${new Date(activeProfile.premium_until).toLocaleDateString()}` : ""}`
                              : "Free plan"}
                          </p>
                        </div>
                        {activeProfile.is_premium ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border border-brand/30 text-brand-2 bg-brand/10">
                            Premium
                          </span>
                        ) : (
                          <Link
                            href="/pricing"
                            className="text-xs font-medium text-brand-2 hover:text-foreground transition-colors"
                          >
                            Upgrade
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border bg-card-hover/50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Show on leaderboard</p>
                          <p className="text-xs text-muted mt-0.5">
                            {activeProfile.show_on_leaderboard
                              ? "Your stats are visible to everyone"
                              : "Hidden — your stats still count, just not shown publicly"}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={activeProfile.show_on_leaderboard}
                          aria-label="Show on leaderboard"
                          disabled={togglingVisibility}
                          onClick={handleToggleLeaderboardVisibility}
                          className={cn(
                            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                          )}
                          style={{
                            background: activeProfile.show_on_leaderboard ? "var(--emerald)" : "var(--surface-3)",
                            borderColor: activeProfile.show_on_leaderboard
                              ? "color-mix(in oklab, var(--emerald) 50%, transparent)"
                              : "var(--border)",
                          }}
                        >
                          <span
                            className={cn(
                              "pointer-events-none mt-[2px] inline-block size-5 rounded-full bg-white shadow-md transition-transform duration-200",
                              activeProfile.show_on_leaderboard ? "translate-x-[22px]" : "translate-x-[2px]",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            <Card padding="lg" className="mb-6 border-2 border-border">
              <h3 className="font-display text-xl text-foreground mb-5">Statistics</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {statConfig.map((s) => (
                  <div
                    key={s.key}
                    className="rounded-lg border border-border bg-card-hover/50 px-3 py-3 text-center transition-all duration-200 hover:border-brand/28"
                  >
                    <p className={cn("font-display text-2xl", s.color || "text-foreground")}>
                      {getStatValue(s.key)}
                    </p>
                    <p className="text-[11px] text-muted mt-1 uppercase">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="ghost" size="md" className="sm:flex-1" asChild>
                <Link href="/leaderboard">View leaderboard</Link>
              </Button>
              <Button
                variant="danger"
                size="md"
                className="sm:flex-1"
                onClick={() => setSignOutConfirmOpen(true)}
              >
                Sign out
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Modal
        open={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        title="Sign out?"
        titleId="sign-out-confirm-title"
      >
        <p className="mb-5 text-sm text-muted">
          You&apos;ll need to sign back in to see your stats and premium packs on this device.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setSignOutConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Modal>
    </>
  );
}
