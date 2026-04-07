"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { FloatingCharacter } from "@/components/ui/FloatingCharacter";
import { ImpostorMini, GhostMini, DetectiveMini, SpectatorFull } from "@/components/ui/Characters";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { loginWithNext } from "@/lib/auth-path";
import { setPreferredDisplayName } from "@/lib/preferred-display-name";
import { cn } from "@/lib/utils";
import Link from "next/link";

const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
];

const statConfig = [
  { key: "games_played" as const, label: "Games Played", color: "" },
  { key: "winRate" as const, label: "Win Rate", color: "text-purple" },
  { key: "group_wins" as const, label: "Group Wins", color: "text-emerald" },
  { key: "impostor_wins" as const, label: "Impostor Wins", color: "text-rose" },
  { key: "impostor_games" as const, label: "Times Impostor", color: "" },
  { key: "impostorWinRate" as const, label: "Impostor Win Rate", color: "text-orange" },
];

function PageSpinner({ label }: { label: string }) {
  return (
    <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-10 -right-20 w-64 h-64 rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />
      <div className="flex flex-col items-center gap-4 relative z-10">
        <svg className="size-8 animate-spin text-purple/50" fill="none" viewBox="0 0 24 24">
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
  const [saving, setSaving] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState("");
  const [recoveryColor, setRecoveryColor] = useState("#06b6d4");
  const [creatingProfile, setCreatingProfile] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(loginWithNext(pathname));
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata as { username?: string; avatar_color?: string } | undefined;
    const fromMeta = meta?.username?.trim();
    setRecoveryUsername(
      fromMeta || user.email?.split("@")[0]?.trim() || `Player_${user.id.slice(0, 6)}`,
    );
    const c = meta?.avatar_color?.trim();
    if (c) setRecoveryColor(c);
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
        <PageSpinner label="Loading profile…" />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <PageSpinner label="Redirecting…" />
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
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
          <div className="absolute bottom-10 -right-20 w-64 h-64 rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />
          <div className="mx-auto max-w-2xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.5em] text-muted/60 mb-3">
                Agent record
              </p>
              <h1 className="font-heading text-4xl text-foreground mb-2">Finish setup</h1>
              <p className="text-sm text-muted max-w-md mx-auto">
                You&apos;re signed in, but there&apos;s no player row in the database yet (often a missed trigger).
                Create your profile here — same permissions as normal signup.
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
                      "size-9 rounded-full transition-all duration-200 cursor-pointer",
                      recoveryColor === c
                        ? "ring-2 ring-purple scale-110 shadow-[0_0_12px_rgba(128,112,212,0.35)]"
                        : "hover:scale-110",
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
                  I already have one — refresh
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
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim(), avatar_color: selectedColor })
      .eq("id", activeUser.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPreferredDisplayName(username.trim());
    toast.success("Profile updated");
    setEditing(false);
    await refreshAuth();
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
        }}
      />
      <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-10 -right-20 w-64 h-64 rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />

        <FloatingCharacter
          from="left"
          delay={0.25}
          floatAmplitude={10}
          floatDuration={5}
          sway
          className="absolute left-4 bottom-16 hidden xl:block"
        >
          <SpectatorFull className="w-28 opacity-18" />
        </FloatingCharacter>
        <FloatingCharacter from="right" delay={0.55} floatAmplitude={12} floatDuration={5.2} className="absolute right-8 top-28 hidden lg:block">
          <DetectiveMini className="w-10 opacity-15" />
        </FloatingCharacter>
        <FloatingCharacter from="left" delay={0.8} floatAmplitude={10} floatDuration={4.5} className="absolute left-10 top-36 hidden lg:block">
          <GhostMini className="w-9 opacity-15" />
        </FloatingCharacter>
        <FloatingCharacter from="right" delay={0.4} floatAmplitude={11} floatDuration={5.5} className="absolute right-6 bottom-24 hidden xl:block">
          <ImpostorMini className="w-12 opacity-18" />
        </FloatingCharacter>

        <div className="mx-auto max-w-2xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-muted/60 mb-3">
              Agent record
            </p>
            <h1 className="font-heading text-4xl text-foreground mb-2">Profile</h1>
            <p className="text-sm text-muted max-w-md mx-auto">
              Your alias, colors, and stats carry into online matches and the leaderboard.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card padding="lg" className="text-center mb-6 border-2 border-border shadow-[0_0_40px_rgba(168,85,247,0.06)]">
              <motion.div
                initial={{ scale: 0.88 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
              >
                <Avatar
                  name={activeProfile.username}
                  color={activeProfile.avatar_color}
                  size="lg"
                  className="mx-auto mb-4 !size-24 !text-3xl"
                />
              </motion.div>
              <h2 className="font-heading text-3xl text-foreground mb-1 tracking-wide">
                {activeProfile.username}
              </h2>
              <p className="text-sm text-muted mb-1">
                {activeUser.is_anonymous ? "Guest operative" : activeUser.email}
              </p>
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
                  <h3 className="font-heading text-lg text-foreground mb-4">Customize</h3>
                  <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mb-4"
                  />
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Avatar color
                  </label>
                  <div className="flex gap-2 flex-wrap mb-5">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={cn(
                          "size-9 rounded-full transition-all duration-200 cursor-pointer",
                          selectedColor === c
                            ? "ring-2 ring-purple scale-110 shadow-[0_0_12px_rgba(128,112,212,0.35)]"
                            : "hover:scale-110",
                        )}
                        style={{ backgroundColor: c }}
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

            <Card padding="lg" className="mb-6 border-2 border-border">
              <h3 className="font-heading text-xl text-foreground mb-5">Statistics</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {statConfig.map((s) => (
                  <div
                    key={s.key}
                    className="rounded-2xl border-2 border-border bg-card-hover/50 px-3 py-3 text-center transition-all duration-200 hover:border-purple/20"
                  >
                    <p className={cn("font-heading text-2xl", s.color || "text-foreground")}>
                      {getStatValue(s.key)}
                    </p>
                    <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">
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
              <Button variant="danger" size="md" className="sm:flex-1" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
