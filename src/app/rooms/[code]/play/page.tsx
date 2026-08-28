"use client";

import { use, useEffect, useState, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { loginWithNext } from "@/lib/auth-path";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRoom } from "@/lib/hooks/use-room";
import { usePlayerSecret, useChat } from "@/lib/hooks/use-game";
import { createClient } from "@/lib/supabase/client";
import { getPlayerIdentity, getVoteTargetIdentity } from "@/lib/game/player-identity";
import type { RoomSettings } from "@/lib/rooms/settings";
import { readDeadlines } from "@/lib/rooms/deadlines";
import { formatCountdown, useCountdown, useDeadlineTrigger } from "@/lib/hooks/use-countdown";
import { tokenColor } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import type { ChatMessage } from "@/types/game";

type GameRound = Database["public"]["Tables"]["game_rounds"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];
type PlayerSecret = Database["public"]["Tables"]["player_secrets"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

type SendMessage = (text: string, userId: string, displayName: string) => void;

const PHASE_META: Record<string, { label: string; tone: "brand" | "aqua" | "heat"; icon: IconName }> = {
  role_reveal: { label: "Role reveal", tone: "brand", icon: "eye" },
  clue_phase: { label: "Clue phase", tone: "aqua", icon: "chat" },
  discussion: { label: "Discussion", tone: "brand", icon: "users" },
  voting: { label: "Voting", tone: "heat", icon: "vote" },
  results: { label: "Results", tone: "brand", icon: "trophy" },
};

export default function OnlinePlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { room, players, loading, gone, refetch } = useRoom(code);
  const { secret, loading: secretLoading } = usePlayerSecret(room?.current_round_id ?? null);
  const { messages, sendMessage } = useChat(room?.id ?? null);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  useEffect(() => {
    if (!loading && room && room.phase === "lobby") {
      router.replace(`/rooms/${code}`);
    }
  }, [room, loading, code, router]);

  useEffect(() => {
    const t = setTimeout(() => setLoadingTooLong(loading), loading ? 5000 : 0);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (!room || !user || players.length === 0) return;
    const currentPlayer = players[room.current_turn_index];
    const shouldStep =
      (room.phase === "clue_phase" && currentPlayer?.is_bot) ||
      room.phase === "voting";
    if (!shouldStep) return;

    const delay = room.phase === "clue_phase" ? 1400 : 900;
    const timer = setTimeout(() => {
      void fetch(`/api/rooms/${code}/bot-step`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    }, delay);

    return () => clearTimeout(timer);
  }, [code, room, user, players]);

  // Each of these used to fall through to a permanent "Loading game" screen
  // with no way out. They're genuinely different situations, so say which one
  // it is and always leave a route forward.
  if (loading) {
    return (
      <RoomGate title="Loading game" text="Fetching the table…">
        {loadingTooLong && (
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        )}
      </RoomGate>
    );
  }

  if (!user) {
    return (
      <RoomGate
        title="Sign in to play"
        text="Online rooms need an account so we can seat you at the table."
      >
        <Button asChild>
          <Link href={loginWithNext(`/rooms/${code}/play`)}>Sign in</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/signup?next=/rooms/${code}/play`}>Create account</Link>
        </Button>
      </RoomGate>
    );
  }

  if (!room) {
    // `gone` means a query actually confirmed the room is missing or expired.
    // Without it we only failed to reach the database, which is worth retrying
    // rather than announcing the room as dead.
    return gone ? (
      <RoomGate
        title="This room is gone"
        text={`Room ${code.toUpperCase()} has finished or expired after 10 minutes of inactivity.`}
      >
        <Button asChild>
          <Link href="/rooms">Find another table</Link>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </RoomGate>
    ) : (
      <RoomGate
        title="Can't reach the table"
        text="We couldn't load this room just now. Your seat is still there — this is a connection problem, not the end of the round."
      >
        <Button onClick={() => refetch()}>Try again</Button>
        <Button variant="secondary" asChild>
          <Link href="/rooms">Back to rooms</Link>
        </Button>
      </RoomGate>
    );
  }

  const myPlayer = players.find((p) => p.user_id === user.id);
  const isHost = room.host_id === user.id;
  const meta = PHASE_META[room.phase] ?? PHASE_META.clue_phase;
  const settings = (room.settings ?? {}) as Partial<RoomSettings>;
  const topic = secret?.topic ?? settings.category ?? "Mixed";

  async function handleLeave() {
    await fetch(`/api/rooms/${code}/leave`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    router.push("/rooms");
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 pt-24 pb-10">
      {/* round header */}
      <div className="card mb-3.5" style={{ padding: "12px 16px" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Logo size={24} showWord={false} />
            <Chip tone="brand" icon="globe">Room {room.code}</Chip>
            <Chip icon="dice">{topic}</Chip>
            <Chip tone={meta.tone} icon={meta.icon}>{meta.label}</Chip>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLeave}>Leave</Button>
        </div>
      </div>

      {/* player rail */}
      <div className="card mb-3.5 overflow-x-auto" style={{ padding: "12px 14px" }}>
        <div className="flex gap-4" style={{ width: "max-content" }}>
          {players.map((p, i) => {
            const isTurn = room.phase === "clue_phase" && i === room.current_turn_index;
            const hasClue = Boolean(p.clue_text);
            return (
              <div key={p.id} className="flex min-w-[64px] flex-col items-center gap-2">
                <div className="relative">
                  <Avatar name={p.display_name} color={tokenColor(getPlayerIdentity(p))} size="md" you={p.user_id === user.id} />
                  {room.phase === "clue_phase" && hasClue && (
                    <span className="token-badge" style={{ color: "var(--emerald)" }}>
                      <Icon name="check" size={11} stroke={3} />
                    </span>
                  )}
                  {isTurn && (
                    <span
                      className="absolute rounded-lg"
                      style={{ inset: -4, border: "2px solid var(--aqua)" }}
                    />
                  )}
                </div>
                <span
                  className="max-w-[72px] truncate text-[11.5px] font-semibold"
                  style={{ color: p.user_id === user.id ? "var(--brand-2)" : "var(--muted)" }}
                >
                  {p.display_name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* stage + chat */}
      <div className="chatroom-grid">
        <div>
          {room.phase === "role_reveal" && (
            <OnlineRoleReveal
              code={code}
              secret={secret}
              loading={secretLoading}
              isHost={isHost}
            />
          )}
          {room.phase === "clue_phase" && (
            <OnlineCluePhase code={code} room={room} players={players} userId={user.id} secret={secret} myDisplayName={myPlayer?.display_name ?? ""} />
          )}
          {room.phase === "discussion" && (
            <OnlineDiscussionPhase room={room} players={players} isHost={isHost} sendMessage={sendMessage} />
          )}
          {room.phase === "voting" && (
            <OnlineVotingPhase code={code} room={room} players={players} userId={user.id} isHost={isHost} />
          )}
          {room.phase === "results" && (
            <OnlineResultsPhase code={code} room={room} players={players} userId={user.id} isHost={isHost} />
          )}
        </div>

        <ChatPanel
          messages={messages}
          sendMessage={sendMessage}
          userId={user.id}
          myDisplayName={myPlayer?.display_name ?? "Me"}
        />
      </div>
    </main>
  );
}

/* Wrapper for the non-reveal phase panels — the design's "stage" card. */
function Stage({ children }: { children: React.ReactNode }) {
  return <div className="card card-pad" style={{ minHeight: 420 }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Reveal
// ─────────────────────────────────────────────────────────────────────────────
function OnlineRoleReveal({
  code,
  secret,
  loading,
  isHost,
}: {
  code: string;
  secret: PlayerSecret | null;
  loading: boolean;
  isHost: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const advancedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (!revealed) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setCountdown(10);
      interval = setInterval(() => {
        setCountdown((c) => {
          if (c === null || c <= 1) {
            if (interval) clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, 0);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [revealed]);

  useEffect(() => {
    if (countdown !== 0 || advancedRef.current) return;
    advancedRef.current = true;
    const delay = isHost ? 0 : 2000 + Math.random() * 2500;
    const t = setTimeout(() => {
      void fetch(`/api/rooms/${code}/advance`, { method: "POST", credentials: "include" }).catch(() => {});
    }, delay);
    return () => clearTimeout(t);
  }, [countdown, isHost, code]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-muted">Getting your role</p>
      </div>
    );
  }

  const isImpostor = secret?.role === "impostor";

  if (!revealed) {
    return (
      <div className="flex flex-col items-center gap-5 py-10 text-center">
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="role-ic cursor-pointer"
          style={{ width: 96, height: 96, ["--c" as string]: "var(--brand)", background: "var(--brand)" }}
          aria-label="Reveal your role"
        >
          <Icon name="lock" size={44} />
        </button>
        <h2 className="display text-[40px]">TAP TO REVEAL</h2>
        <p className="max-w-[300px] text-sm text-muted">No peeking, this one is yours only</p>
      </div>
    );
  }

  const c = isImpostor ? "var(--heat)" : "var(--aqua)";
  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <div
        className="role-card pop-in"
        style={{
          ["--c" as string]: c,
          borderColor: `color-mix(in oklab, ${c} 50%, transparent)`,
        }}
      >
        <div className="role-ic" style={{ background: c }}>
          <Icon name={isImpostor ? "mask" : "shield"} size={40} />
        </div>
        {isImpostor ? (
          <>
            <h2 className="display" style={{ fontSize: 46, color: "var(--heat)" }}>IMPOSTER</h2>
            <p className="mx-auto mt-1 max-w-[320px] text-[14.5px] text-muted">
              No secret word, blend in and survive the vote
            </p>
            <div className="role-chip">
              <span className="display" style={{ fontSize: 34, color: "var(--amber)" }}>{secret?.topic}</span>
              <span className="text-[12px] font-bold text-muted">Category · Word: ???</span>
            </div>
          </>
        ) : (
          <>
            <h2 className="display" style={{ fontSize: 46, color: "var(--aqua)" }}>CREW</h2>
            <p className="mx-auto mt-1 max-w-[320px] text-[14.5px] text-muted">
              You know the word, clue carefully
            </p>
            <div className="role-chip">
              <span className="display" style={{ fontSize: 30, color: "var(--amber)" }}>{secret?.topic}</span>
              <span className="text-[12px] font-bold text-muted">Category</span>
              <span className="display mt-2" style={{ fontSize: 38, color: "var(--text)" }}>{secret?.secret_word}</span>
              <span className="text-[12px] font-bold text-muted">Word</span>
            </div>
          </>
        )}
      </div>

      {countdown !== null && (
        <div className="flex flex-col items-center gap-1.5">
          {countdown > 0 ? (
            <>
              <p className="text-sm text-muted">Clue phase starts in</p>
              <span className="display text-[40px]" style={{ color: "var(--brand-2)" }}>{countdown}</span>
            </>
          ) : (
            <p className="text-sm font-semibold" style={{ color: "var(--brand-2)" }}>Starting</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clue Phase — inline answer bar (the design's clue board)
// ─────────────────────────────────────────────────────────────────────────────
function OnlineCluePhase({
  code,
  room,
  players,
  userId,
  secret,
}: {
  code: string;
  room: Room;
  players: RoomPlayer[];
  userId: string;
  secret: PlayerSecret | null;
  myDisplayName: string;
}) {
  const [clue, setClue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const currentPlayer = players[room.current_turn_index];
  const isMyTurn = currentPlayer?.user_id === userId;
  const myClue = players.find((p) => p.user_id === userId)?.clue_text;

  // Per-turn clock: when it runs out the turn is skipped, so one player can't
  // stall the table. Every client watches it, not just the one whose turn it is.
  const { turnEndsAt } = readDeadlines(room.settings);
  const turnSeconds = useCountdown(turnEndsAt);
  useDeadlineTrigger(turnEndsAt, room.phase === "clue_phase", () => {
    void fetch(`/api/rooms/${code}/advance`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  });

  async function handleSubmitClue() {
    if (!clue.trim()) return;
    const submittedClue = clue.trim();
    setSubmitting(true);
    const res = await fetch(`/api/rooms/${code}/clue`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clue: submittedClue }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      toast.error((data as { error?: string }).error || "Failed to submit clue");
      return;
    }
    setClue("");
  }

  const isImpostor = secret?.role === "impostor";
  const reminder = isImpostor ? secret?.topic : secret?.secret_word;

  return (
    <Stage>
      <div className="flex h-full flex-col gap-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[19px]">Clue board</h3>
              {turnSeconds !== null && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums"
                  style={{
                    background:
                      turnSeconds <= 10
                        ? "color-mix(in oklab, var(--heat) 18%, transparent)"
                        : "var(--surface-2)",
                    color: turnSeconds <= 10 ? "var(--heat-2)" : "var(--muted)",
                  }}
                  aria-label={`${turnSeconds} seconds left this turn`}
                >
                  {formatCountdown(turnSeconds)}
                </span>
              )}
            </div>
            <p className="text-[13px] text-muted">One word each, prove it without giving it away</p>
          </div>
          {reminder && (
            <div
              className="rounded-lg px-3 py-2 text-right leading-none"
              style={{
                border: `1px solid color-mix(in oklab, ${isImpostor ? "var(--amber)" : "var(--aqua)"} 35%, transparent)`,
                background: `color-mix(in oklab, ${isImpostor ? "var(--amber)" : "var(--aqua)"} 8%, transparent)`,
              }}
            >
              <div className="display" style={{ fontSize: 22, color: "var(--text)", lineHeight: 1 }}>{reminder}</div>
              <div className="mt-1 text-[10px] font-bold" style={{ whiteSpace: "nowrap", color: isImpostor ? "var(--amber)" : "var(--aqua-2)" }}>
                {isImpostor ? "Category" : "Word"}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {players.map((p) => {
            const clueText = p.clue_text;
            const isTurn = currentPlayer ? getPlayerIdentity(p) === getPlayerIdentity(currentPlayer) : false;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg px-3.5 py-2.5"
                style={{
                  border: "1px solid var(--border)",
                  background: isTurn && !clueText ? "color-mix(in oklab, var(--aqua) 10%, transparent)" : "rgba(255,255,255,.015)",
                }}
              >
                <Avatar name={p.display_name} color={tokenColor(getPlayerIdentity(p))} size="sm" you={p.user_id === userId} />
                <span className="text-[14px] font-semibold" style={{ color: p.user_id === userId ? "var(--brand-2)" : "var(--text)" }}>
                  {p.display_name}
                </span>
                <span className="flex-1" />
                {clueText ? (
                  <span className="display text-[20px]" style={{ color: "var(--aqua-2)" }}>{clueText}</span>
                ) : isTurn ? (
                  <span className="chip chip-aqua" style={{ fontSize: 10 }}>thinking</span>
                ) : (
                  <span className="text-[12.5px] text-muted">waiting</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1" />

        {isMyTurn && !myClue ? (
          <div className="answer-bar pop-in">
            <div className="flex gap-2">
              <input
                autoFocus
                aria-label="Your one-word hint"
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmitClue()}
                placeholder="One word"
                maxLength={40}
                className="field"
              />
              <Button variant="primary" onClick={handleSubmitClue} disabled={!clue.trim()} isLoading={submitting}>
                <Icon name="send" size={17} /> Send
              </Button>
            </div>
          </div>
          ) : (
            <div className="flex items-center justify-center gap-2 p-3.5 text-[13.5px] text-muted">
              {myClue ? (
              <><Icon name="check" size={15} style={{ color: "var(--emerald)" }} /> Hint locked, waiting for the table</>
            ) : (
              <><span className="typing"><i /><i /><i /></span> Waiting for {currentPlayer?.display_name ?? "someone"} to type</>
            )}
          </div>
        )}
      </div>
    </Stage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Discussion Phase
// ─────────────────────────────────────────────────────────────────────────────
function OnlineDiscussionPhase({
  room,
  players,
  isHost,
  sendMessage,
}: {
  room: Room;
  players: RoomPlayer[];
  isHost: boolean;
  sendMessage: SendMessage;
}) {
  const settings = room.settings as Partial<RoomSettings> | null;
  const timerDuration = settings?.discussionTimer ?? 60;
  const [seconds, setSeconds] = useState(timerDuration);
  const advancedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (seconds > 0 || advancedRef.current) return;
    advancedRef.current = true;
    const delay = isHost ? 0 : 2000 + Math.random() * 2500;
    const t = setTimeout(() => {
      void fetch(`/api/rooms/${room.code}/advance`, { method: "POST", credentials: "include" }).catch(() => {});
    }, delay);
    if (isHost) sendMessage("Time is up, voting started", "system", "Game");
    return () => clearTimeout(t);
  }, [seconds, isHost, room.code, sendMessage]);

  return (
    <Stage>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[19px]">Discussion</h3>
            <p className="text-[13px] text-muted">Read the clues. Who&apos;s faking it?</p>
          </div>
          <div className="flex items-center gap-2" style={{ color: seconds < 15 ? "var(--heat)" : "var(--text)" }}>
            <Icon name="clock" size={16} />
            <span className="display text-[22px]">0:{String(seconds).padStart(2, "0")}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg px-3.5 py-2.5" style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,.015)" }}>
              <Avatar name={p.display_name} color={tokenColor(getPlayerIdentity(p))} size="sm" />
              <span className="text-[14px] font-semibold">{p.display_name}</span>
              <span className="flex-1" />
              <span className="display text-[20px]" style={{ color: "var(--aqua-2)" }}>{p.clue_text || "-"}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[13px] text-muted">
          {seconds > 0 ? "Talk through who feels suspicious" : "Advancing to voting"}
        </p>
      </div>
    </Stage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Voting Phase
// ─────────────────────────────────────────────────────────────────────────────
function OnlineVotingPhase({
  code,
  room,
  players,
  userId,
  isHost,
}: {
  code: string;
  room: Room;
  players: RoomPlayer[];
  userId: string;
  isHost: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const voteSettings = (room.settings ?? {}) as Partial<RoomSettings>;
  const [seconds, setSeconds] = useState(voteSettings.votingTimer ?? 30);
  const resolveTriggered = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const roundId = room.current_round_id;
    if (!roundId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("votes")
      .select("id")
      .eq("round_id", roundId)
      .eq("voter_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setHasVoted(true);
      });
    return () => { cancelled = true; };
  }, [room.current_round_id, userId]);

  useEffect(() => {
    if (seconds > 0 || resolveTriggered.current) return;
    resolveTriggered.current = true;
    const delay = isHost ? 0 : 1500 + Math.random() * 2000;
    const t = setTimeout(() => {
      void fetch(`/api/rooms/${code}/resolve`, { method: "POST", credentials: "include" }).catch(() => {});
    }, delay);
    return () => clearTimeout(t);
  }, [seconds, code, isHost]);

  async function handleVote() {
    if (!selectedId) return;
    setSubmitting(true);
    const res = await fetch(`/api/rooms/${code}/vote`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votedForId: selectedId }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to vote");
      return;
    }
    setHasVoted(true);
    toast.success("Vote submitted");
  }

  const otherPlayers = players.filter((p) => getPlayerIdentity(p) !== userId);

  if (hasVoted) {
    const timeUp = seconds <= 0;
    return (
      <Stage>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Chip tone="heat" icon="vote">Vote submitted</Chip>
          <div className="role-ic" style={{ width: 84, height: 84, background: "var(--heat)" }}>
            <Icon name={timeUp ? "target" : "clock"} size={40} />
          </div>
          <p className="text-muted">{timeUp ? "Time is up, tallying votes" : "Waiting for other votes"}</p>
        </div>
      </Stage>
    );
  }

  return (
    <Stage>
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[19px]">Who&apos;s the impostor?</h3>
            <p className="text-[13px] text-muted">Tap someone to vote</p>
          </div>
          <div className="flex items-center gap-2" style={{ color: seconds < 10 ? "var(--heat)" : "var(--text)" }}>
            <Icon name="clock" size={16} />
            <span className="display text-[22px]">0:{String(seconds).padStart(2, "0")}</span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
          {otherPlayers.map((p) => {
            const playerId = getPlayerIdentity(p);
            const picked = selectedId === playerId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(playerId)}
                className="vote-card"
                style={{
                  borderColor: picked ? "var(--heat)" : "var(--border)",
                  background: picked ? "color-mix(in oklab, var(--heat) 12%, transparent)" : "var(--surface)",
                }}
              >
                <Avatar name={p.display_name} color={tokenColor(playerId)} size="md" />
                <span className="text-[14px] font-bold">{p.display_name}</span>
                {picked && <span className="chip chip-heat absolute right-2 top-2" style={{ fontSize: 9 }}>Your vote</span>}
              </button>
            );
          })}
        </div>

        <Button variant="heat" size="lg" className="w-full" disabled={!selectedId || seconds <= 0} onClick={handleVote} isLoading={submitting}>
          <Icon name="target" size={18} /> {seconds <= 0 ? "Tallying votes" : selectedId ? `Lock vote for ${players.find((p) => getPlayerIdentity(p) === selectedId)?.display_name}` : "Pick someone to vote"}
        </Button>
      </div>
    </Stage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Results Phase
// ─────────────────────────────────────────────────────────────────────────────
function OnlineResultsPhase({
  code,
  room,
  players,
  userId,
  isHost,
}: {
  code: string;
  room: Room;
  players: RoomPlayer[];
  userId: string;
  isHost: boolean;
}) {
  const supabase = createClient();
  const [round, setRound] = useState<GameRound | null>(null);
  const [votes, setVotes] = useState<Pick<Database["public"]["Tables"]["votes"]["Row"], "voter_id" | "voter_bot_id" | "voted_for_id" | "voted_for_bot_id">[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchResults() {
      if (!room.current_round_id) return;
      const { data: roundData } = await supabase.from("game_rounds").select("*").eq("id", room.current_round_id).single();
      setRound(roundData);
      const { data: voteData } = await supabase.from("votes").select("voter_id, voter_bot_id, voted_for_id, voted_for_bot_id").eq("round_id", room.current_round_id);
      setVotes(voteData ?? []);
      setLoading(false);
    }
    fetchResults();
    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.current_round_id]);

  async function handlePlayAgain() {
    const res = await fetch(`/api/rooms/${code}/start`, { method: "POST", credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : "Failed to start new round");
      return;
    }
    router.replace(`/rooms/${code}/play`);
    router.refresh();
  }

  async function handleBackToLobby() {
    const res = await fetch(`/api/rooms/${code}/reset`, { method: "POST", credentials: "include" });
    if (!res.ok) {
      toast.error("Failed to return to lobby");
      return;
    }
    router.push(`/rooms/${code}`);
  }

  if (loading || !round) {
    return (
      <Stage>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted">Loading results</p>
        </div>
      </Stage>
    );
  }

  const impostorIdSet = new Set(
    [
      round.impostor_id,
      round.second_impostor_id,
      round.impostor_bot_id,
      round.second_impostor_bot_id,
    ].filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  const impostors = players.filter((p) => impostorIdSet.has(getPlayerIdentity(p)));
  const groupWon = round.winner === "group";

  const voteCounts: Record<string, number> = {};
  for (const v of votes) {
    const targetId = getVoteTargetIdentity(v);
    if (targetId) voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  }
  const myVote = votes.find((v) => v.voter_id === userId);
  const myVotedIdentity = myVote ? getVoteTargetIdentity(myVote) : null;
  const myVotedName = myVotedIdentity ? players.find((p) => getPlayerIdentity(p) === myVotedIdentity)?.display_name : null;

  return (
    <Stage>
      <div className="pop-in flex flex-col items-center gap-4 text-center">
        <Chip tone={groupWon ? "aqua" : "heat"} icon={groupWon ? "trophy" : "flame"}>
          {groupWon ? "Crew wins" : "Impostor escapes"}
        </Chip>

        <div className="role-ic" style={{ width: 84, height: 84, background: "var(--heat)" }}>
          <Icon name="mask" size={42} />
        </div>
        <h2 className="display" style={{ fontSize: 48, color: "var(--heat)" }}>
          {impostors.map((p) => p.display_name).join(" & ") || "-"}
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="result-stat">
            <span className="display text-[26px]" style={{ color: "var(--aqua-2)" }}>{round.secret_word}</span>
            <span className="text-[11px] font-bold text-muted">Secret word</span>
          </div>
          <div className="result-stat">
            <span className="display text-[26px]" style={{ color: "var(--amber)" }}>{round.topic}</span>
            <span className="text-[11px] font-bold text-muted">Category</span>
          </div>
          <div className="result-stat">
            <span className="display text-[26px]" style={{ color: groupWon ? "var(--emerald)" : "var(--heat)" }}>{myVotedName || "-"}</span>
            <span className="text-[11px] font-bold text-muted">Your vote</span>
          </div>
        </div>

        {/* vote breakdown */}
        <div className="mt-2 w-full">
          <p className="mb-3 text-center text-sm font-bold text-foreground">Votes</p>
          <div className="flex flex-col gap-2">
            {players.map((p) => {
              const identity = getPlayerIdentity(p);
              const isImp = impostorIdSet.has(identity);
              const count = voteCounts[identity] || 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg px-3.5 py-2.5"
                  style={{
                    border: isImp ? "1px solid color-mix(in oklab, var(--heat) 40%, transparent)" : "1px solid var(--border)",
                    background: isImp ? "color-mix(in oklab, var(--heat) 10%, transparent)" : "rgba(255,255,255,.015)",
                  }}
                >
                  <Avatar name={p.display_name} color={tokenColor(identity)} size="sm" role={isImp ? "impostor" : undefined} />
                  <span className="text-[14px] font-semibold">{p.display_name}</span>
                  <span className="flex-1" />
                  <span className="text-[13px] text-muted">{count} vote{count !== 1 ? "s" : ""}</span>
                  {isImp && <span className="chip chip-heat" style={{ fontSize: 9 }}>Impostor</span>}
                </div>
              );
            })}
          </div>
        </div>

        {isHost ? (
          <div className="mt-2 flex w-full flex-wrap justify-center gap-2">
            <Button variant="primary" size="lg" onClick={handlePlayAgain}>
              <Icon name="play" size={17} fill /> Play again
            </Button>
            <Button variant="secondary" size="lg" onClick={handleBackToLobby}>Back to lobby</Button>
          </div>
        ) : (
          <p className="text-sm text-muted">Waiting for the host</p>
        )}
      </div>
    </Stage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat panel — the persistent table chat
// ─────────────────────────────────────────────────────────────────────────────
function ChatPanel({
  messages,
  sendMessage,
  userId,
  myDisplayName,
}: {
  messages: ChatMessage[];
  sendMessage: SendMessage;
  userId: string;
  myDisplayName: string;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send() {
    const v = input.trim();
    if (!v) return;
    sendMessage(v, userId, myDisplayName);
    setInput("");
  }

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="flex items-center gap-2 text-[14px] font-bold">
          <Icon name="chat" size={16} /> Table chat
        </span>
      </div>

      <div className="chat-scroll">
        {messages.length === 0 && <p className="py-4 text-center text-xs text-muted">No messages yet</p>}
        {messages.map((m) => {
          const isSystem = m.userId === "system";
          const isYou = m.userId === userId;
          if (isSystem) {
            return (
              <div key={m.id} className="chat-sys"><Icon name="bolt" size={12} fill /> {m.text}</div>
            );
          }
          return (
            <div key={m.id} className="flex items-start gap-2" style={{ flexDirection: isYou ? "row-reverse" : "row" }}>
              <Avatar name={m.displayName} color={tokenColor(m.userId)} size="xs" you={isYou} />
              <div style={{ maxWidth: "78%" }}>
                <div className="mb-0.5 text-[10.5px] font-semibold" style={{ color: "var(--muted-2)", textAlign: isYou ? "right" : "left" }}>
                  {m.displayName}
                </div>
                <div
                  className="chat-bubble"
                  style={{
                    background: isYou ? "var(--brand)" : "var(--surface-2)",
                    color: isYou ? "var(--brand-ink)" : "var(--text)",
                    borderTopRightRadius: isYou ? 4 : 14,
                    borderTopLeftRadius: isYou ? 14 : 4,
                  }}
                >
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Say something"
          maxLength={500}
          className="field"
        />
        <button onClick={send} className="btn btn-primary btn-sm" style={{ padding: "0 12px", height: 38 }} aria-label="Send message">
          <Icon name="send" size={16} />
        </button>
      </div>
    </div>
  );
}

/** Full-screen state for a room that isn't playable yet (or any more). */
function RoomGate({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-5">
      <div className="w-full max-w-sm text-center">
        <h1 className="display text-[28px] leading-tight">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{text}</p>
        {children && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{children}</div>
        )}
      </div>
    </main>
  );
}
