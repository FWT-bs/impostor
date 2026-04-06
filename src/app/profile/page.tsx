"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { FloatingCharacter } from "@/components/ui/FloatingCharacter";
import { ImpostorMini, GhostMini } from "@/components/ui/Characters";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

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

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <svg className="size-7 animate-spin text-purple/50" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </main>
      </>
    );
  }

  if (!user || !profile) {
    router.push("/login");
    return null;
  }

  function startEdit() {
    setUsername(profile!.username);
    setSelectedColor(profile!.avatar_color);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim(), avatar_color: selectedColor })
      .eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    setEditing(false);
    router.refresh();
  }

  const totalWins = profile.group_wins + profile.impostor_wins;
  const winRate =
    profile.games_played > 0
      ? Math.round((totalWins / profile.games_played) * 100)
      : 0;
  const impostorWinRate =
    profile.impostor_games > 0
      ? Math.round((profile.impostor_wins / profile.impostor_games) * 100)
      : 0;

  function getStatValue(key: (typeof statConfig)[number]["key"]): string | number {
    if (key === "winRate") return `${winRate}%`;
    if (key === "impostorWinRate") return `${impostorWinRate}%`;
    return profile![key as keyof typeof profile] as number ?? 0;
  }

  return (
    <>
      <Header user={{ username: profile.username, avatarColor: profile.avatar_color }} />
      <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-40 left-10 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
        <FloatingCharacter from="left" delay={0.4} floatAmplitude={11} floatDuration={5} className="absolute left-4 bottom-16 hidden xl:block">
          <ImpostorMini className="w-12 opacity-18" />
        </FloatingCharacter>
        <FloatingCharacter from="right" delay={0.7} floatAmplitude={14} floatDuration={6} className="absolute right-8 top-32 hidden xl:block">
          <GhostMini className="w-11 opacity-18" />
        </FloatingCharacter>

        <div className="mx-auto max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Profile card */}
            <Card padding="lg" className="text-center mb-5">
              <motion.div
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
              >
                <Avatar
                  name={profile.username}
                  color={profile.avatar_color}
                  size="lg"
                  className="mx-auto mb-4 !size-20 !text-2xl"
                />
              </motion.div>
              <h1 className="font-heading text-3xl text-foreground mb-1">{profile.username}</h1>
              <p className="text-sm text-muted">
                {user.is_anonymous ? "Guest Player" : user.email}
              </p>
              {!editing && (
                <Button variant="ghost" size="sm" className="mt-3" onClick={startEdit}>
                  Edit Profile
                </Button>
              )}
            </Card>

            {/* Edit form */}
            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
              >
                <Card padding="lg" className="mb-5">
                  <h2 className="font-heading text-lg text-foreground mb-4">Edit Profile</h2>
                  <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mb-4"
                  />
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Avatar Color
                  </label>
                  <div className="flex gap-2 flex-wrap mb-5">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`size-9 rounded-full transition-all duration-200 cursor-pointer ${
                          selectedColor === c
                            ? "ring-2 ring-purple scale-110 shadow-[0_0_12px_rgba(128,112,212,0.35)]"
                            : "hover:scale-110"
                        }`}
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

            {/* Stats */}
            <Card padding="lg" className="mb-5">
              <h2 className="font-heading text-lg text-foreground mb-5">Statistics</h2>
              <div className="grid grid-cols-2 gap-3">
                {statConfig.map((s) => (
                  <div
                    key={s.key}
                    className="rounded-xl border border-border bg-card-hover/60 px-3 py-3 text-center transition-all duration-200 hover:border-purple/15"
                  >
                    <p className={`font-heading text-2xl ${s.color || "text-foreground"}`}>
                      {getStatValue(s.key)}
                    </p>
                    <p className="text-xs text-muted mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Button variant="danger" size="md" className="w-full" onClick={signOut}>
              Sign Out
            </Button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
