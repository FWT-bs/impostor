"use client";

import { use, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRoom } from "@/lib/hooks/use-room";
import { createClient } from "@/lib/supabase/client";
import { cn, tokenColor } from "@/lib/utils";
import { postJson } from "@/lib/api-fetch";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
import { loginWithNext, signupWithNext } from "@/lib/auth-path";
import { getPlayerIdentity } from "@/lib/game/player-identity";
import { describeImpostorCount, type RoomSettings } from "@/lib/rooms/settings";
import Link from "next/link";

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { room, players, loading } = useRoom(code);
  const [starting, setStarting] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [copied, setCopied] = useState(false);

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
    const result = await postJson<{ ok: boolean; is_ready: boolean }>(`/api/rooms/${code}/ready`, {});
    if (!result.ok) toast.error(result.errorMessage);
  }

  async function handleStart() {
    setStarting(true);
    try {
      const res = await fetch(`/api/rooms/${code}/start`, { method: "POST", credentials: "include" });
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

  async function handleKick(playerId: string) {
    const res = await fetch(`/api/rooms/${code}/kick`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : "Failed to kick",
      );
    }
  }

  async function handleLeave() {
    if (!myPlayer) return;
    const supabase = createClient();
    await supabase.from("room_players").delete().eq("id", myPlayer.id);
    router.push("/rooms");
  }

  async function handleJoinRoom() {
    if (!user) return;
    setJoiningRoom(true);
    try {
      const displayName =
        profile?.username?.trim() || getAuthDisplayName(user, profile) || `Player_${user.id.slice(0, 6)}`;
      const result = await postJson<{ room: { code: string } }>("/api/rooms/join", {
        code: code.toUpperCase(),
        displayName,
      });
      if (!result.ok) {
        toast.error(result.errorMessage);
        return;
      }
      router.refresh();
    } finally {
      setJoiningRoom(false);
    }
  }

  function copyCode() {
    if (!room) return;
    void navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  function copyLink() {
    if (!room) return;
    void navigator.clipboard.writeText(`${window.location.origin}/rooms/${room.code}`);
    toast.success("Invite link copied");
  }

  const headerUser = user
    ? { username: getAuthDisplayName(user, profile), avatarColor: getAuthAvatarColor(user, profile) }
    : null;

  if (loading) {
    return (
      <>
        <Header user={headerUser} />
        <main className="reveal-wrap">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted">Opening the room...</p>
          </div>
        </main>
      </>
    );
  }

  if (!room) {
    return (
      <>
        <Header user={headerUser} />
        <main className="reveal-wrap">
          <div className="card card-pad w-full max-w-md text-center">
            <div className="role-ic mx-auto" style={{ ["--c" as string]: "var(--heat)", background: "var(--heat)" }}>
              <Icon name="ghost" size={40} />
            </div>
            <h2 className="mb-2 mt-4 text-xl">Room not found</h2>
            <p className="mb-6 text-sm text-muted">That code may have expired or the host closed the lobby.</p>
            <Button variant="primary" className="w-full" onClick={() => router.push("/rooms")}>Back to rooms</Button>
          </div>
        </main>
      </>
    );
  }

  const settings = (room.settings ?? {}) as Partial<RoomSettings>;

  return (
    <>
      <Header user={headerUser} />
      <main className="mx-auto max-w-[980px] px-5 pt-28 pb-20">
        <div className="mb-1.5">
          <Chip icon={room.is_private ? "lock" : "globe"} tone="brand">
            {room.is_private ? "Private room" : "Public room"}
          </Chip>
        </div>
        <h1 className="mb-7 text-[44px] leading-none">Your room is ready</h1>

        <div className="grid items-start gap-[18px] lg:grid-cols-[1.15fr_1fr]">
          {/* Left: code and players */}
          <div className="flex flex-col gap-4">
            <div className="card card-pad glow-ring text-center">
              <p className="kicker mb-2.5">Share this code</p>
              <div
                className="display"
                style={{
                  fontSize: 76,
                  letterSpacing: 0,
                  color: "var(--brand-2)",
                }}
              >
                {room.code}
              </div>
              <div className="mt-3.5 flex items-center justify-center gap-2">
                <Button variant="secondary" size="sm" onClick={copyCode}>
                  <Icon name={copied ? "check" : "copy"} size={15} /> {copied ? "Copied!" : "Copy code"}
                </Button>
                <Button variant="secondary" size="sm" onClick={copyLink}>
                  <Icon name="send" size={15} /> Invite link
                </Button>
              </div>
            </div>

            <div className="card card-pad">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base">Players</h3>
                <span className="chip">{players.length}/{room.max_players} joined</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4">
                {players.map((p, i) => (
                  <div key={p.id} className="pop-in flex flex-col items-center gap-2" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="relative">
                      <Avatar name={p.display_name} color={tokenColor(getPlayerIdentity(p))} size="lg" you={p.user_id === user?.id} />
                      {isHost && !p.is_host && (
                        <button
                          type="button"
                          onClick={() => handleKick(p.id)}
                          aria-label={`Kick ${p.display_name}`}
                          className="token-badge cursor-pointer"
                          style={{ color: "var(--heat)" }}
                        >
                          <Icon name="x" size={11} stroke={2.6} />
                        </button>
                      )}
                    </div>
                    <span
                      className="max-w-[80px] truncate text-center text-[13px] font-semibold"
                      style={{ fontFamily: "var(--font-head)", color: p.user_id === user?.id ? "var(--brand-2)" : "var(--text)" }}
                    >
                      {p.display_name}
                    </span>
                    {p.is_host ? (
                      <span className="chip chip-brand" style={{ fontSize: 9.5, padding: "3px 8px" }}>
                        <Icon name="crown" size={10} /> Host
                      </span>
                    ) : p.is_bot ? (
                      <span className="chip chip-heat" style={{ fontSize: 9.5, padding: "3px 8px" }}>
                        <Icon name="mask" size={10} /> AI
                      </span>
                    ) : (
                      <span
                        className="chip"
                        style={{
                          fontSize: 9.5,
                          padding: "3px 8px",
                          color: p.is_ready ? "var(--emerald)" : "var(--muted)",
                          borderColor: p.is_ready ? "color-mix(in oklab, var(--emerald) 40%, transparent)" : "var(--border)",
                        }}
                      >
                        {p.is_ready ? "Ready" : "Waiting"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: round info and action */}
          <div className="flex flex-col gap-4">
            <div className="card card-pad">
              <h3 className="mb-[18px] text-base">Round setup</h3>
              <Setting label="Topic pack">
                <Chip tone="brand" icon="dice">{settings.category || "Mixed"}</Chip>
              </Setting>
              <Setting label="Discussion timer">
                <Chip icon="clock">{settings.discussionTimer ? `${settings.discussionTimer}s` : "60s"}</Chip>
              </Setting>
              <Setting label="Voting timer">
                <Chip icon="vote">{settings.votingTimer ? `${settings.votingTimer}s` : "30s"}</Chip>
              </Setting>
              <Setting label="Impostors">
                <Chip icon="mask">{describeImpostorCount(settings.impostorCount)}</Chip>
              </Setting>
              <Setting label="Clue style">
                <Chip icon="chat">{settings.clueMode === "single" ? "One word" : settings.clueMode === "short" ? "Short" : "Classic"}</Chip>
              </Setting>
              {settings.aiTable && (
                <Setting label="AI seats">
                  <Chip tone="heat" icon="eye">{settings.tableLabel ?? "Practice table"}</Chip>
                </Setting>
              )}
              <Setting label="Max players">
                <span className="display text-[28px]" style={{ color: "var(--brand-2)" }}>{room.max_players}</span>
              </Setting>
              <Setting label="Minimum to start" last>
                <Chip>3 players</Chip>
              </Setting>
            </div>

            {!user ? (
              <div className="card card-pad text-center">
                <p className="mb-4 text-sm text-muted">Sign in to join this room</p>
                <div className="flex gap-3">
                  <Button variant="secondary" size="lg" className="flex-1" asChild>
                    <Link href={loginWithNext(pathname)}>Sign in</Link>
                  </Button>
                  <Button variant="primary" size="lg" className="flex-1" asChild>
                    <Link href={signupWithNext(pathname)}>Sign up</Link>
                  </Button>
                </div>
              </div>
            ) : !myPlayer ? (
              <Button variant="primary" size="lg" className="w-full" onClick={handleJoinRoom} isLoading={joiningRoom}>
                <Icon name="plus" size={18} /> Join room
              </Button>
            ) : isHost ? (
              <>
                <Button variant="primary" size="lg" className="w-full" onClick={handleStart} disabled={!canStartNow} isLoading={starting}>
                  <Icon name="play" size={18} fill /> {canStartNow ? "Start round" : `Need ${playersNeeded} more`}
                </Button>
                <p className="text-center text-[12.5px] text-muted">bots are labeled, stats only count real players</p>
              </>
            ) : (
              <div className="card card-pad flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Ready status</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {myPlayer.is_ready ? "You're ready to go" : "Toggle when you're set"}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={myPlayer.is_ready}
                  onClick={handleToggleReady}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  )}
                  style={{
                    background: myPlayer.is_ready ? "var(--emerald)" : "var(--surface-3)",
                    borderColor: myPlayer.is_ready ? "color-mix(in oklab, var(--emerald) 50%, transparent)" : "var(--border)",
                  }}
                >
                  <span
                    className={cn(
                      "pointer-events-none mt-[2px] inline-block size-5 rounded-full bg-white shadow-md transition-transform duration-200",
                      myPlayer.is_ready ? "translate-x-[22px]" : "translate-x-[2px]",
                    )}
                  />
                </button>
              </div>
            )}

            {myPlayer && (
              <Button variant="ghost" size="md" className="w-full" onClick={handleLeave}>
                Leave room
              </Button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function Setting({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        paddingBottom: last ? 0 : 16,
        marginBottom: last ? 0 : 16,
        borderBottom: last ? "none" : "1px solid var(--border)",
      }}
    >
      <p
        className="mb-2.5 text-[13px] font-semibold uppercase"
        style={{ fontFamily: "var(--font-head)", color: "var(--muted)", letterSpacing: ".06em" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
