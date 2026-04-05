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
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
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
          <p className="text-muted">Loading...</p>
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

  return (
    <>
      <Header
        user={{ username: profile.username, avatarColor: profile.avatar_color }}
      />
      <main className="min-h-screen bg-background pt-20 pb-12 px-4 relative overflow-hidden">
        <div className="absolute top-40 left-10 w-[300px] h-[300px] rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />

        <div className="mx-auto max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card padding="lg" className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Avatar
                  name={profile.username}
                  color={profile.avatar_color}
                  size="lg"
                  className="mx-auto mb-4 !size-20 !text-2xl"
                />
              </motion.div>
              <h1 className="font-heading text-3xl text-foreground mb-1">
                {profile.username}
              </h1>
              <p className="text-sm text-muted">
                {user.is_anonymous ? "👻 Guest Player" : `✉️ ${user.email}`}
              </p>
              {!editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={startEdit}
                >
                  ✏️ Edit Profile
                </Button>
              )}
            </Card>

            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Card padding="lg" className="mb-6">
                  <h2 className="font-heading text-lg text-foreground mb-4">
                    ✏️ Edit Profile
                  </h2>
                  <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mb-4"
                  />
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Avatar Color
                  </label>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`size-9 rounded-full transition-all duration-200 cursor-pointer ${
                          selectedColor === c
                            ? "ring-2 ring-purple scale-115 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleSave}
                      isLoading={saving}
                    >
                      Save
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            <Card padding="lg" className="mb-6">
              <h2 className="font-heading text-lg text-foreground mb-4">
                📊 Statistics
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Games Played" value={profile.games_played} emoji="🎮" />
                <StatBox
                  label="Win Rate"
                  value={`${winRate}%`}
                  color="text-purple"
                  emoji="🏆"
                />
                <StatBox
                  label="Group Wins"
                  value={profile.group_wins}
                  color="text-emerald"
                  emoji="👥"
                />
                <StatBox
                  label="Impostor Wins"
                  value={profile.impostor_wins}
                  color="text-rose"
                  emoji="🕵️"
                />
                <StatBox
                  label="Times as Impostor"
                  value={profile.impostor_games}
                  emoji="🎭"
                />
                <StatBox
                  label="Impostor Win Rate"
                  value={`${impostorWinRate}%`}
                  color="text-orange"
                  emoji="📈"
                />
              </div>
            </Card>

            <Button
              variant="danger"
              size="md"
              className="w-full"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </motion.div>
        </div>
      </main>
    </>
  );
}

function StatBox({
  label,
  value,
  color = "text-foreground",
  emoji,
}: {
  label: string;
  value: string | number;
  color?: string;
  emoji?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card-hover/50 px-3 py-3 text-center transition-all duration-200 hover:border-purple/20 hover:bg-card-hover">
      {emoji && <span className="text-lg" aria-hidden>{emoji}</span>}
      <p className={`font-heading text-2xl ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
