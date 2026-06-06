"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRoom } from "@/lib/hooks/use-room";
import { usePlayerSecret, useChat } from "@/lib/hooks/use-game";
import { createClient } from "@/lib/supabase/client";
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
  const { room, players, loading, refetch } = useRoom(code);
  const { secret, loading: secretLoading } = usePlayerSecret(room?.current_round_id ?? null);
  const { messages, sendMessage } = useChat(room?.id ?? null);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  useEffect(() => {
    if (!loading && room && room.phase === "lobby") {
      router.replace(`/rooms/${code}`);
    }
  }, [room, loading, code, router]);

  useEffect(() => {
    if (!loading) { setLoadingTooLong(false); return; }
    const t = setTimeout(() => setLoadingTooLong(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading || !room || !user) {
    return (
      <main className="reveal-wrap">
        <div className="flex flex-col items-center gap-4">
          <span className="livedot" />
          <p className="text-sm text-muted">Loading game…</p>
          {loadingTooLong && (
            <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
          )}
        </div>
      </main>
    );
  }

  const myPlayer = players.find((p) => p.user_id === user.id);
  const isHost = room.host_id === user.id;
  const meta = PHASE_META[room.phase] ?? PHASE_META.clue_phase;
  const settings = (room.settings ?? {}) as { category?: string };
  const topic = secret?.topic ?? settings.category ?? "Mixed";

  async function handleLeave() {
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
                  <Avatar name={p.display_name} color={tokenColor(p.user_id)} size="md" you={p.user_id === user.id} />
                  {room.phase === "clue_phase" && hasClue && (
                    <span className="token-badge" style={{ color: "var(--emerald)" }}>
                      <Icon name="check" size={11} stroke={3} />
                    </span>
                  )}
                  {isTurn && (
                    <span
                      className="absolute rounded-2xl"
                      style={{ inset: -4, border: "2px solid var(--aqua)", animation: "ping 1.6s infinite" }}
                    />
                  )}
                </div>
                <span
                  className="max-w-[72px] truncate text-[11.5px] font-semibold"
                  style={{ fontFamily: "var(--font-head)", color: p.user_id === user.id ? "var(--brand-2)" : "var(--muted)" }}
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
          <AnimatePresence mode="wait">
            {room.phase === "role_reveal" && (
              <motion.div key="role_reveal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineRoleReveal
                  secret={secret}
                  loading={secretLoading}
                  roomId={room.id}
                  isHost={isHost}
                  sendMessage={sendMessage}
                />
              </motion.div>
            )}
            {room.phase === "clue_phase" && (
              <motion.div key="clue_phase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineCluePhase code={code} room={room} players={players} userId={user.id} secret={secret} sendMessage={sendMessage} myDisplayName={myPlayer?.display_name ?? ""} />
              </motion.div>
            )}
            {room.phase === "discussion" && (
              <motion.div key="discussion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineDiscussionPhase room={room} players={players} isHost={isHost} sendMessage={sendMessage} />
              </motion.div>
            )}
            {room.phase === "voting" && (
              <motion.div key="voting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineVotingPhase code={code} room={room} players={players} userId={user.id} isHost={isHost} />
              </motion.div>
            )}
            {room.phase === "results" && (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineResultsPhase code={code} room={room} players={players} userId={user.id} isHost={isHost} />
              </motion.div>
            )}
          </AnimatePresence>
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
  secret,
  loading,
  roomId,
  isHost,
  sendMessage,
}: {
  secret: PlayerSecret | null;
  loading: boolean;
  roomId: string;
  isHost: boolean;
  sendMessage: SendMessage;
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
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [revealed]);

  useEffect(() => {
    if (countdown !== 0 || advancedRef.current) return;
    advancedRef.current = true;
    const delay = isHost ? 0 : 2000 + Math.random() * 2500;
    const t = setTimeout(() => {
      const supabase = createClient();
      void supabase
        .from("rooms")
        .update({ phase: "clue_phase", current_turn_index: 0 })
        .eq("id", roomId)
        .eq("phase", "role_reveal");
    }, delay);
    if (isHost) {
      sendMessage("🎮 Clue phase is starting — give hints that prove you know the word!", "system", "Game");
    }
    return () => clearTimeout(t);
  }, [countdown, isHost, roomId, sendMessage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="livedot" />
        <p className="text-muted">Getting your role…</p>
      </div>
    );
  }

  const isImpostor = secret?.role === "impostor";

  if (!revealed) {
    return (
      <div className="flex flex-col items-center gap-5 py-10 text-center">
        <p className="kicker">Your role is hidden</p>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="role-ic float cursor-pointer"
          style={{ width: 96, height: 96, ["--c" as string]: "var(--brand)", background: "linear-gradient(150deg, var(--brand), color-mix(in oklab, var(--brand) 55%, #000))" }}
          aria-label="Reveal your role"
        >
          <Icon name="lock" size={44} />
        </button>
        <h2 className="display text-[40px]">TAP TO REVEAL</h2>
        <p className="max-w-[300px] text-sm text-muted">Make sure nobody else is peeking — your role is for your eyes only.</p>
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
          boxShadow: `0 0 60px -16px ${c}, inset 0 1px 0 rgba(255,255,255,.08)`,
        }}
      >
        <div className="role-ic" style={{ background: `linear-gradient(150deg, ${c}, color-mix(in oklab, ${c} 55%, #000))` }}>
          <Icon name={isImpostor ? "mask" : "shield"} size={40} />
        </div>
        {isImpostor ? (
          <>
            <p className="kicker" style={{ color: "var(--heat-2)" }}>You are the</p>
            <h2 className="display" style={{ fontSize: 58, color: "var(--heat)" }}>IMPOSTER</h2>
            <p className="mx-auto mt-1 max-w-[320px] text-[14.5px] text-muted">
              You don&apos;t know the secret word. Blend in, fake a clue, and survive the vote.
            </p>
            <div className="role-chip">
              <span className="kicker" style={{ fontSize: 10 }}>Your only hint — the topic</span>
              <span className="display" style={{ fontSize: 34, color: "var(--amber)" }}>{secret?.topic}</span>
            </div>
          </>
        ) : (
          <>
            <p className="kicker" style={{ color: "var(--aqua-2)" }}>You are</p>
            <h2 className="display" style={{ fontSize: 58, color: "var(--aqua)" }}>CREW</h2>
            <p className="mx-auto mt-1 max-w-[320px] text-[14.5px] text-muted">
              You know the word. Prove it with a clue — but don&apos;t make it too easy for the faker.
            </p>
            <div className="role-chip">
              <span className="kicker" style={{ fontSize: 10 }}>The secret word</span>
              <span className="display" style={{ fontSize: 38, color: "var(--text)" }}>{secret?.secret_word}</span>
              <span className="text-[12px] text-muted">Topic · {secret?.topic}</span>
            </div>
          </>
        )}
      </div>

      {countdown !== null && (
        <div className="flex flex-col items-center gap-1.5">
          {countdown > 0 ? (
            <>
              <p className="text-sm text-muted">Clue phase starts in…</p>
              <span className="display text-[40px]" style={{ color: "var(--brand-2)" }}>{countdown}</span>
            </>
          ) : (
            <p className="text-sm font-semibold" style={{ color: "var(--brand-2)" }}>Starting…</p>
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
  sendMessage,
  myDisplayName,
}: {
  code: string;
  room: Room;
  players: RoomPlayer[];
  userId: string;
  secret: PlayerSecret | null;
  sendMessage: SendMessage;
  myDisplayName: string;
}) {
  const [clue, setClue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const currentPlayer = players[room.current_turn_index];
  const isMyTurn = currentPlayer?.user_id === userId;
  const myClue = players.find((p) => p.user_id === userId)?.clue_text;
  const announcedRef = useRef<number>(-1);

  useEffect(() => {
    const idx = room.current_turn_index;
    if (idx === announcedRef.current) return;
    const player = players[idx];
    if (!player) return;
    announcedRef.current = idx;
    if (player.user_id === userId) {
      sendMessage(`⏳ ${player.display_name} is choosing their hint…`, "system", "Game");
    }
  }, [room.current_turn_index, players, userId, sendMessage]);

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
    sendMessage(`🎤 ${myDisplayName} gave the hint "${submittedClue}"!`, "system", "Game");
    if ((data as { allDone?: boolean }).allDone) {
      sendMessage("✅ All hints given — discussion starting!", "system", "Game");
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
            <h3 className="text-[19px]">Clue board</h3>
            <p className="text-[13px] text-muted">One word each. Prove you know it — don&apos;t give it away.</p>
          </div>
          {reminder && (
            <div
              className="rounded-xl px-3 py-2 text-right leading-none"
              style={{
                border: `1px solid color-mix(in oklab, ${isImpostor ? "var(--amber)" : "var(--aqua)"} 35%, transparent)`,
                background: `color-mix(in oklab, ${isImpostor ? "var(--amber)" : "var(--aqua)"} 8%, transparent)`,
              }}
            >
              <div className="kicker" style={{ fontSize: 9, marginBottom: 5, whiteSpace: "nowrap", color: isImpostor ? "var(--amber)" : "var(--aqua-2)" }}>
                {isImpostor ? "Your topic" : "Your word"}
              </div>
              <div className="display" style={{ fontSize: 22, color: "var(--text)", lineHeight: 1 }}>{reminder}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {players.map((p) => {
            const clueText = p.clue_text;
            const isTurn = p.user_id === currentPlayer?.user_id;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-[14px] px-3.5 py-2.5"
                style={{
                  border: "1px solid var(--border)",
                  background: isTurn && !clueText ? "color-mix(in oklab, var(--aqua) 10%, transparent)" : "rgba(255,255,255,.015)",
                }}
              >
                <Avatar name={p.display_name} color={tokenColor(p.user_id)} size="sm" you={p.user_id === userId} />
                <span className="text-[14px] font-semibold" style={{ fontFamily: "var(--font-head)", color: p.user_id === userId ? "var(--brand-2)" : "var(--text)" }}>
                  {p.display_name}
                </span>
                <span className="flex-1" />
                {clueText ? (
                  <span className="display text-[20px]" style={{ color: "var(--aqua-2)" }}>{clueText}</span>
                ) : isTurn ? (
                  <span className="chip chip-aqua" style={{ fontSize: 10 }}>thinking…</span>
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
            <p className="kicker mb-2" style={{ color: "var(--aqua-2)" }}>Your turn — type your clue</p>
            <div className="flex gap-2">
              <input
                autoFocus
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmitClue()}
                placeholder="One word…"
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
              <><Icon name="check" size={15} style={{ color: "var(--emerald)" }} /> Clue locked in — waiting for the table</>
            ) : (
              <><span className="typing"><i /><i /><i /></span> Waiting for {currentPlayer?.display_name ?? "…"}…</>
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
  const settings = room.settings as { discussionTimer?: number } | null;
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
      const supabase = createClient();
      void supabase.from("rooms").update({ phase: "voting" }).eq("id", room.id).eq("phase", "discussion");
    }, delay);
    if (isHost) sendMessage("⏰ Time's up — voting has started!", "system", "Game");
    return () => clearTimeout(t);
  }, [seconds, isHost, room.id, sendMessage]);

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
            <div key={p.id} className="flex items-center gap-3 rounded-[14px] px-3.5 py-2.5" style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,.015)" }}>
              <Avatar name={p.display_name} color={tokenColor(p.user_id)} size="sm" />
              <span className="text-[14px] font-semibold" style={{ fontFamily: "var(--font-head)" }}>{p.display_name}</span>
              <span className="flex-1" />
              <span className="display text-[20px]" style={{ color: "var(--aqua-2)" }}>{p.clue_text || "—"}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[13px] text-muted">
          {seconds > 0 ? "Discuss who the impostor might be in chat →" : "Advancing to voting…"}
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
  const [seconds, setSeconds] = useState(30);
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
    toast.success("Vote submitted! 🗳️");
  }

  const otherPlayers = players.filter((p) => p.user_id !== userId);

  if (hasVoted) {
    const timeUp = seconds <= 0;
    return (
      <Stage>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Chip tone="heat" icon="vote">Vote submitted</Chip>
          <div className="role-ic" style={{ width: 84, height: 84, background: "linear-gradient(150deg, var(--heat), color-mix(in oklab, var(--heat) 55%, #000))" }}>
            <Icon name={timeUp ? "target" : "clock"} size={40} />
          </div>
          <p className="text-muted">{timeUp ? "Time's up — tallying the votes…" : "Waiting for other players to vote…"}</p>
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
            <p className="text-[13px] text-muted">Tap a player to cast your vote.</p>
          </div>
          <div className="flex items-center gap-2" style={{ color: seconds < 10 ? "var(--heat)" : "var(--text)" }}>
            <Icon name="clock" size={16} />
            <span className="display text-[22px]">0:{String(seconds).padStart(2, "0")}</span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
          {otherPlayers.map((p) => {
            const picked = selectedId === p.user_id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.user_id)}
                className="vote-card"
                style={{
                  borderColor: picked ? "var(--heat)" : "var(--border)",
                  background: picked ? "color-mix(in oklab, var(--heat) 12%, transparent)" : "var(--surface)",
                }}
              >
                <Avatar name={p.display_name} color={tokenColor(p.user_id)} size="md" />
                <span className="text-[14px] font-bold" style={{ fontFamily: "var(--font-head)" }}>{p.display_name}</span>
                {picked && <span className="chip chip-heat absolute right-2 top-2" style={{ fontSize: 9 }}>Your vote</span>}
              </button>
            );
          })}
        </div>

        <Button variant="heat" size="lg" className="w-full" disabled={!selectedId || seconds <= 0} onClick={handleVote} isLoading={submitting}>
          <Icon name="target" size={18} /> {seconds <= 0 ? "Tallying votes…" : selectedId ? `Lock vote — ${players.find((p) => p.user_id === selectedId)?.display_name}` : "Pick someone to vote"}
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
  const [votes, setVotes] = useState<{ voter_id: string; voted_for_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchResults() {
      if (!room.current_round_id) return;
      const { data: roundData } = await supabase.from("game_rounds").select("*").eq("id", room.current_round_id).single();
      setRound(roundData);
      const { data: voteData } = await supabase.from("votes").select("voter_id, voted_for_id").eq("round_id", room.current_round_id);
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
    await supabase.from("rooms").update({ status: "waiting", phase: "lobby" }).eq("id", room.id);
    router.push(`/rooms/${code}`);
  }

  if (loading || !round) {
    return (
      <Stage>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="livedot" />
          <p className="text-muted">Loading results…</p>
        </div>
      </Stage>
    );
  }

  const impostorIdSet = new Set(
    [round.impostor_id, round.second_impostor_id].filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  const impostors = players.filter((p) => impostorIdSet.has(p.user_id));
  const groupWon = round.winner === "group";

  const voteCounts: Record<string, number> = {};
  for (const v of votes) voteCounts[v.voted_for_id] = (voteCounts[v.voted_for_id] || 0) + 1;
  const myVote = votes.find((v) => v.voter_id === userId);
  const myVotedName = myVote ? players.find((p) => p.user_id === myVote.voted_for_id)?.display_name : null;

  return (
    <Stage>
      <div className="pop-in flex flex-col items-center gap-4 text-center">
        <Chip tone={groupWon ? "aqua" : "heat"} icon={groupWon ? "trophy" : "flame"}>
          {groupWon ? "Crew wins" : "Impostor escapes"}
        </Chip>

        <div className="role-ic" style={{ width: 84, height: 84, background: "linear-gradient(150deg, var(--heat), color-mix(in oklab, var(--heat) 55%, #000))" }}>
          <Icon name="mask" size={42} />
        </div>
        <div>
          <p className="kicker" style={{ color: "var(--heat-2)" }}>{impostors.length > 1 ? "The impostors were" : "The impostor was"}</p>
          <h2 className="display" style={{ fontSize: 48, color: "var(--heat)" }}>
            {impostors.map((p) => p.display_name).join(" & ") || "—"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="result-stat">
            <span className="kicker" style={{ fontSize: 9 }}>Secret word</span>
            <span className="display text-[26px]" style={{ color: "var(--aqua-2)" }}>{round.secret_word}</span>
          </div>
          <div className="result-stat">
            <span className="kicker" style={{ fontSize: 9 }}>Topic</span>
            <span className="display text-[26px]" style={{ color: "var(--amber)" }}>{round.topic}</span>
          </div>
          <div className="result-stat">
            <span className="kicker" style={{ fontSize: 9 }}>Your vote</span>
            <span className="display text-[26px]" style={{ color: groupWon ? "var(--emerald)" : "var(--heat)" }}>{myVotedName || "—"}</span>
          </div>
        </div>

        {/* vote breakdown */}
        <div className="mt-2 w-full">
          <p className="kicker mb-3 text-center">Votes</p>
          <div className="flex flex-col gap-2">
            {players.map((p) => {
              const isImp = impostorIdSet.has(p.user_id);
              const count = voteCounts[p.user_id] || 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-[14px] px-3.5 py-2.5"
                  style={{
                    border: isImp ? "1px solid color-mix(in oklab, var(--heat) 40%, transparent)" : "1px solid var(--border)",
                    background: isImp ? "color-mix(in oklab, var(--heat) 10%, transparent)" : "rgba(255,255,255,.015)",
                  }}
                >
                  <Avatar name={p.display_name} color={tokenColor(p.user_id)} size="sm" role={isImp ? "impostor" : undefined} />
                  <span className="text-[14px] font-semibold" style={{ fontFamily: "var(--font-head)" }}>{p.display_name}</span>
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
          <p className="text-sm text-muted">Waiting for the host to continue…</p>
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
        <span className="flex items-center gap-2 text-[14px] font-bold" style={{ fontFamily: "var(--font-head)" }}>
          <Icon name="chat" size={16} /> Table chat
        </span>
        <span className="chip"><span className="livedot" style={{ width: 6, height: 6 }} /> live</span>
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
                <div className="mb-0.5 text-[10.5px] font-semibold" style={{ color: "var(--muted-2)", fontFamily: "var(--font-head)", textAlign: isYou ? "right" : "left" }}>
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
          placeholder="Say something…"
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
