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
      <main className="min-h-screen bg-background pt-20 pb-12 px-4">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card padding="lg" className="text-center mb-6">
              <Avatar
                name={profile.username}
                color={profile.avatar_color}
                size="lg"
                className="mx-auto mb-4"
              />
              <h1 className="font-heading text-3xl text-foreground mb-1">
                {profile.username}
              </h1>
              <p className="text-sm text-muted">
                {user.is_anonymous ? "Guest Player" : user.email}
              </p>
              {!editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={startEdit}
                >
                  Edit Profile
                </Button>
              )}
            </Card>

            {editing && (
              <Card padding="lg" className="mb-6">
                <h2 className="font-heading text-lg text-foreground mb-4">
                  Edit Profile
                </h2>
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mb-4"
                />
                <label className="block text-sm font-medium text-foreground mb-2">
                  Avatar Color
                </label>
                <div className="flex gap-2 flex-wrap mb-4">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`size-8 rounded-full transition-transform ${
                        selectedColor === c
                          ? "ring-2 ring-teal scale-110"
                          : "hover:scale-105"
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
            )}

            <Card padding="lg" className="mb-6">
              <h2 className="font-heading text-lg text-foreground mb-4">
                Statistics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Games Played" value={profile.games_played} />
                <StatBox
                  label="Win Rate"
                  value={`${winRate}%`}
                  color="text-teal"
                />
                <StatBox
                  label="Group Wins"
                  value={profile.group_wins}
                  color="text-success"
                />
                <StatBox
                  label="Impostor Wins"
                  value={profile.impostor_wins}
                  color="text-danger"
                />
                <StatBox
                  label="Times as Impostor"
                  value={profile.impostor_games}
                />
                <StatBox
                  label="Impostor Win Rate"
                  value={`${impostorWinRate}%`}
                  color="text-amber"
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
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card-hover px-3 py-3 text-center">
      <p className={`font-heading text-2xl ${color}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
