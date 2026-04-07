"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { FloatingCharacter } from "@/components/ui/FloatingCharacter";
import { GhostMini, DetectiveMini, SpectatorFull } from "@/components/ui/Characters";
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

  const isHost = Boolean(user && room?.host_id === user.id);
  const myPlayer = players.find((p) => p.user_id === user?.id);
  const canStartNow = isHost && players.length >= 3;
  const playersNeeded = Math.max(0, 3 - players.length);

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
    try {
      const res = await fetch(`/api/rooms/${code}/start`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data === "object" && data && "error" in data && typeof (data as { error: string }).error === "string"
            ? (data as { error: string }).error
            : "Failed to start",
        );
        return;
      }
      router.push(`/rooms/${code}/play`);
    } finally {
      setStarting(false);
    }
  }

  async function handleKick(userId: string) {
    const res = await fetch(`/api/rooms/${code}/kick`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        typeof data === "object" && data && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to kick",
      );
    }
  }

  async function handleLeave() {
    if (!myPlayer) return;
    const supabase = createClient();
    await supabase.from("room_players").delete().eq("id", myPlayer.id);
    router.push("/rooms");
  }

  const headerUser =
    profile
      ? { username: profile.username, avatarColor: profile.avatar_color }
      : user
        ? { username: user.email?.split("@")[0] ?? "Player", avatarColor: "#8070d4" }
        : null;

  if (loading) {
    return (
      <>
        <Header user={headerUser} />
        <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
          <div className="absolute bottom-10 -right-20 w-64 h-64 rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />
          <div className="flex flex-col items-center gap-4 relative z-10">
            <svg className="size-8 animate-spin text-purple/50" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-muted">Opening briefing room…</p>
          </div>
        </main>
      </>
    );
  }

  if (!room) {
    return (
      <>
        <Header user={headerUser} />
        <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
          <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
          <div className="mx-auto max-w-lg relative z-10 flex min-h-[60vh] flex-col items-center justify-center">
            <Card padding="lg" className="w-full text-center border-2 border-border">
              <div className="text-4xl mb-3" aria-hidden>
                😵
              </div>
              <p className="font-heading text-xl text-foreground mb-2">Room not found</p>
              <p className="text-sm text-muted mb-6">
                That code may have expired or the host closed the lobby.
              </p>
              <Button variant="primary" className="w-full" onClick={() => router.push("/rooms")}>
                Back to rooms
              </Button>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header user={headerUser} />
      <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-10 -right-20 w-64 h-64 rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />

        <FloatingCharacter
          from="left"
          delay={0.3}
          floatAmplitude={10}
          floatDuration={4.8}
          sway
          className="absolute left-4 bottom-16 hidden xl:block"
        >
          <SpectatorFull className="w-28 opacity-18" />
        </FloatingCharacter>
        <FloatingCharacter from="right" delay={0.55} floatAmplitude={12} floatDuration={5.5} className="absolute right-8 top-28 hidden lg:block">
          <DetectiveMini className="w-10 opacity-15" />
        </FloatingCharacter>
        <FloatingCharacter from="left" delay={0.85} floatAmplitude={10} floatDuration={4.2} className="absolute left-10 top-40 hidden lg:block">
          <GhostMini className="w-9 opacity-15" />
        </FloatingCharacter>

        <div className="mx-auto max-w-2xl relative z-10">
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-muted/60 mb-3">Briefing room</p>
            {room.is_private && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-orange/15 text-orange px-3 py-1 rounded-full mb-3 border border-orange/25">
                Private lobby
              </span>
            )}
            <h1 className="font-heading text-5xl sm:text-6xl text-purple tracking-[0.28em] mb-2">
              {room.code}
            </h1>
            <p className="text-sm text-muted max-w-md mx-auto mb-3">
              Share this code or copy the invite link so detectives can join.
            </p>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(
                  `${window.location.origin}/rooms/${room.code}`,
                );
                toast.success("Invite link copied");
              }}
            >
              Copy invite link
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card padding="lg" className="mb-6 border-2 border-border shadow-[0_0_36px_rgba(168,85,247,0.06)]">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="font-heading text-lg text-foreground">
                  Players ({players.length}/{room.max_players})
                </h2>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Min 3 to play
                </span>
              </div>
              <div className="space-y-3">
                {players.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 200 }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 transition-all duration-200",
                      p.is_ready || p.is_host
                        ? "border-emerald/35 bg-emerald/5"
                        : "border-border bg-card",
                    )}
                  >
                    <Avatar
                      name={p.display_name}
                      color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-foreground truncate">
                      {p.display_name}
                    </span>
                    {p.is_host && (
                      <span className="text-[10px] shrink-0 bg-orange/20 text-orange px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        Host
                      </span>
                    )}
                    <span
                      className={cn(
                        "ml-auto shrink-0 text-xs font-medium",
                        p.is_ready || p.is_host ? "text-emerald" : "text-muted",
                      )}
                    >
                      {p.is_host ? "Ready" : p.is_ready ? "Ready" : "Waiting"}
                    </span>
                    {isHost && !p.is_host && (
                      <button
                        type="button"
                        onClick={() => handleKick(p.user_id)}
                        className="text-xs text-rose hover:text-rose/85 ml-1 cursor-pointer shrink-0"
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
            transition={{ delay: 0.2 }}
          >
            {isHost ? (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleStart}
                  disabled={!canStartNow}
                  isLoading={starting}
                >
                  {canStartNow ? "Start now" : `Need ${playersNeeded} more`}
                </Button>
                <p className="text-center text-xs text-muted">
                  Host can begin as soon as three players are in the lobby. Ready toggles are optional —
                  use them to signal when you&apos;re set.
                </p>
              </>
            ) : (
              <Button
                variant={myPlayer?.is_ready ? "secondary" : "primary"}
                size="lg"
                className="w-full"
                onClick={handleToggleReady}
              >
                {myPlayer?.is_ready ? "Mark not ready" : "Ready"}
              </Button>
            )}
            <Button variant="ghost" size="md" className="w-full text-muted" onClick={handleLeave}>
              Leave room
            </Button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
