"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRoom } from "@/lib/hooks/use-room";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
];

export default function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const { room, players, loading } = useRoom(code);
  const [starting, setStarting] = useState(false);

  const isHost = user && room?.host_id === user.id;
  const myPlayer = players.find((p) => p.user_id === user?.id);
  const allReady = players.every((p) => p.is_ready || p.is_host);
  const canStart = isHost && players.length >= 3 && allReady;

  useEffect(() => {
    if (!loading && room?.phase && room.phase !== "lobby" && room.status === "playing") {
      router.push(`/rooms/${code}/play`);
    }
  }, [room, loading, code, router]);

  async function handleToggleReady() {
    if (!myPlayer) return;
    const supabase = createClient();
    await supabase
      .from("room_players")
      .update({ is_ready: !myPlayer.is_ready })
      .eq("id", myPlayer.id);
  }

  async function handleStart() {
    setStarting(true);
    const res = await fetch(`/api/rooms/${code}/start`, {
      method: "POST",
    });
    const data = await res.json();
    setStarting(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to start");
      return;
    }
    router.push(`/rooms/${code}/play`);
  }

  async function handleKick(userId: string) {
    const res = await fetch(`/api/rooms/${code}/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to kick");
    }
  }

  async function handleLeave() {
    if (!myPlayer) return;
    const supabase = createClient();
    await supabase.from("room_players").delete().eq("id", myPlayer.id);
    router.push("/rooms");
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted">Loading room...</p>
        </main>
      </>
    );
  }

  if (!room) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <Card padding="lg" className="text-center">
            <div className="text-4xl mb-3">😵</div>
            <p className="text-foreground mb-4">Room not found</p>
            <Button variant="primary" onClick={() => router.push("/rooms")}>
              Back to Rooms
            </Button>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        user={
          profile
            ? { username: profile.username, avatarColor: profile.avatar_color }
            : null
        }
      />
      <main className="min-h-screen bg-background pt-20 pb-12 px-4 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-[300px] h-[300px] rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />

        <div className="mx-auto max-w-lg relative z-10">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {room.is_private && (
              <span className="inline-block text-xs bg-orange/20 text-orange px-3 py-1 rounded-full mb-2 font-bold">
                🔒 Private Room
              </span>
            )}
            <p className="text-sm text-muted mb-1">Room Code</p>
            <h1 className="font-heading text-5xl text-purple tracking-[0.3em] mb-2">
              {room.code}
            </h1>
            <p className="text-sm text-muted">
              Share this code with friends to join
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/rooms/${room.code}`
                );
                toast.success("Link copied! 🔗");
              }}
            >
              📋 Copy Invite Link
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card padding="lg" className="mb-6">
              <h2 className="font-heading text-lg text-foreground mb-4">
                👥 Players ({players.length}/{room.max_players})
              </h2>
              <div className="space-y-3">
                {players.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05, type: "spring", stiffness: 200 }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 px-3 py-2 transition-all duration-200",
                      p.is_ready || p.is_host
                        ? "border-emerald/30 bg-emerald/5"
                        : "border-border bg-card"
                    )}
                  >
                    <Avatar
                      name={p.display_name}
                      color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {p.display_name}
                    </span>
                    {p.is_host && (
                      <span className="text-xs bg-orange/20 text-orange px-2 py-0.5 rounded-full font-bold">
                        👑 HOST
                      </span>
                    )}
                    <span
                      className={cn(
                        "ml-auto text-xs font-medium",
                        p.is_ready || p.is_host
                          ? "text-emerald"
                          : "text-muted"
                      )}
                    >
                      {p.is_host ? "✓ Ready" : p.is_ready ? "✓ Ready" : "⏳ Not Ready"}
                    </span>
                    {isHost && !p.is_host && (
                      <button
                        onClick={() => handleKick(p.user_id)}
                        className="text-xs text-rose hover:text-rose/80 ml-2 cursor-pointer"
                      >
                        Kick
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isHost ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleStart}
                disabled={!canStart}
                isLoading={starting}
              >
                {players.length < 3
                  ? `Need ${3 - players.length} more player${3 - players.length > 1 ? "s" : ""}`
                  : !allReady
                    ? "⏳ Waiting for everyone to ready up"
                    : "🚀 Start Game"}
              </Button>
            ) : (
              <Button
                variant={myPlayer?.is_ready ? "secondary" : "primary"}
                size="lg"
                className="w-full"
                onClick={handleToggleReady}
              >
                {myPlayer?.is_ready ? "Not Ready" : "✋ Ready Up"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="md"
              className="w-full text-muted"
              onClick={handleLeave}
            >
              Leave Room
            </Button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
