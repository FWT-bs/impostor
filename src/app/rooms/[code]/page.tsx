"use client";

import { use, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRoom } from "@/lib/hooks/use-room";
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
    await fetch(`/api/rooms/${code}/leave`, {
      method: "POST",
      credentials: "include",
    });
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
      const nextCode = result.data?.room?.code;
      if (nextCode && nextCode !== code.toUpperCase()) {
        router.replace(`/rooms/${nextCode}`);
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
      <main className="mx-auto max-w-[1280px] px-5 pb-20 pt-24 sm:pt-28">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[40px] leading-none sm:text-[52px]">Room {room.code}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={copyCode}>
              <Icon name={copied ? "check" : "copy"} size={15} /> {copied ? "Copied" : "Copy code"}
            </Button>
            <Button variant="secondary" size="sm" onClick={copyLink}>
              <Icon name="send" size={15} /> Invite link
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="card card-pad">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Seats</h2>
              <PlainStat label="Joined" value={`${players.length}/${room.max_players}`} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {players.map((p, i) => (
                <SeatCard
                  key={p.id}
                  player={p}
                  index={i}
                  isMe={p.user_id === user?.id}
                  canKick={isHost && !p.is_host}
                  onKick={() => handleKick(p.id)}
                />
              ))}
              {Array.from({ length: Math.max(0, room.max_players - players.length) }).map((_, index) => (
                <EmptySeat key={`empty-${index}`} index={players.length + index} />
              ))}
            </div>
          </section>

          <aside className="grid gap-4">
            <div className="card card-pad">
              <h2 className="mb-4 text-xl font-bold">Setup</h2>
              <div className="grid gap-2">
                <SetupRow icon="dice" label="Topic pack" value={settings.category || "Mixed"} />
                <SetupRow icon="clock" label="Discussion" value={settings.discussionTimer ? `${settings.discussionTimer}s` : "60s"} />
                <SetupRow icon="vote" label="Voting" value={settings.votingTimer ? `${settings.votingTimer}s` : "30s"} />
                <SetupRow icon="mask" label="Impostors" value={describeImpostorCount(settings.impostorCount)} />
                <SetupRow icon="chat" label="Clues" value={settings.clueMode === "single" ? "One word" : settings.clueMode === "short" ? "Short" : "Classic"} />
                {settings.aiTable && <SetupRow icon="eye" label="Table" value={settings.tableLabel ?? "Ready table"} tone="heat" />}
              </div>
            </div>

            {!user ? (
              <div className="card card-pad text-center">
                <p className="mb-4 text-sm text-muted">Sign in to join</p>
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
          </aside>
        </div>
      </main>
    </>
  );
}

type RoomPlayer = ReturnType<typeof useRoom>["players"][number];

function SeatCard({
  player,
  index,
  isMe,
  canKick,
  onKick,
}: {
  player: RoomPlayer;
  index: number;
  isMe: boolean;
  canKick: boolean;
  onKick: () => void;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3", isMe && "border-brand/45 bg-brand/10")}>
      <Avatar name={player.display_name} color={tokenColor(getPlayerIdentity(player))} size="md" you={isMe} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{player.display_name}</p>
        <p className="text-xs text-muted">
          Seat {index + 1} · {player.is_host ? "host" : player.is_ready || player.is_bot ? "ready" : "waiting"}
        </p>
      </div>
      {canKick && (
        <button
          type="button"
          onClick={onKick}
          aria-label={`Kick ${player.display_name}`}
          className="grid size-9 place-items-center rounded-lg border border-border text-heat transition-colors hover:border-heat/45 hover:bg-heat/10"
        >
          <Icon name="x" size={15} />
        </button>
      )}
    </div>
  );
}

function EmptySeat({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background/25 p-3 text-muted">
      <div className="grid size-10 place-items-center rounded-lg border border-border bg-background/40">
        <Icon name="plus" size={16} />
      </div>
      <div>
        <p className="text-sm font-bold">Open seat</p>
        <p className="text-xs">Seat {index + 1}</p>
      </div>
    </div>
  );
}

function SetupRow({
  icon,
  label,
  value,
  tone = "brand",
}: {
  icon: "dice" | "clock" | "vote" | "mask" | "chat" | "eye";
  label: string;
  value: string;
  tone?: "brand" | "heat";
}) {
  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background/45 px-3 py-2.5">
      <div className={cn("grid size-8 place-items-center rounded-lg border", tone === "heat" ? "border-heat/35 text-heat-2" : "border-brand/35 text-brand-2")}>
        <Icon name={icon} size={16} />
      </div>
      <span className="text-sm text-muted">{label}</span>
      <span className="max-w-[150px] truncate text-right text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}

function PlainStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/45 px-3 py-2 text-right">
      <p className="text-[11px] font-bold uppercase text-muted">{label}</p>
      <p className="text-lg font-black text-brand-2">{value}</p>
    </div>
  );
}
