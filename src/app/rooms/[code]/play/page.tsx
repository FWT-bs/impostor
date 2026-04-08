"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Timer } from "@/components/ui/Timer";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRoom } from "@/lib/hooks/use-room";
import { usePlayerSecret, useChat } from "@/lib/hooks/use-game";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
];

type GameRound = Database["public"]["Tables"]["game_rounds"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];

/** Persistent chat sidebar shown during all game phases */
function ChatPanel({
  messages,
  sendMessage,
  userId,
  myDisplayName,
  collapsed,
  onToggle,
}: {
  messages: { id: string; userId: string; displayName: string; text: string; timestamp: number }[];
  sendMessage: (text: string, userId: string, displayName: string) => void;
  userId: string;
  myDisplayName: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim(), userId, myDisplayName);
    setChatInput("");
  }

  return (
    <div className="w-full lg:w-72 flex-shrink-0 flex flex-col">
      {/* Header with toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full rounded-t-2xl border-2 border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground lg:rounded-2xl lg:rounded-b-none hover:bg-card-hover transition-colors"
      >
        <span>💬 Chat</span>
        <span className="text-muted text-xs">{collapsed ? "▲ show" : "▼ hide"}</span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-2 border-t-0 border-border rounded-b-2xl bg-card flex flex-col"
          >
            <div className="h-56 lg:h-[calc(100vh-280px)] lg:min-h-48 overflow-y-auto space-y-2 p-3 pr-1">
              {messages.length === 0 && (
                <p className="text-xs text-muted text-center py-4">No messages yet 🤔</p>
              )}
              {messages.map((msg) => {
                const isSystem = msg.userId === "system";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "text-sm rounded-2xl px-3 py-1.5",
                      isSystem
                        ? "bg-purple/5 text-muted italic text-center text-xs"
                        : msg.userId === userId
                        ? "bg-purple/10 text-foreground ml-6"
                        : "bg-card-hover text-foreground mr-6"
                    )}
                  >
                    {!isSystem && (
                      <span className="font-medium text-purple text-xs block">
                        {msg.displayName}
                      </span>
                    )}
                    <p>{msg.text}</p>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 p-3 pt-2 border-t border-border">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 min-w-0 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-purple transition-all duration-200"
              />
              <Button variant="primary" size="sm" onClick={handleSend}>
                ↑
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OnlinePlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { room, players, loading, refetch } = useRoom(code);
  const { secret, loading: secretLoading } = usePlayerSecret(
    room?.current_round_id ?? null
  );
  const { messages, sendMessage } = useChat(room?.id ?? null);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  useEffect(() => {
    if (!loading && room && room.phase === "lobby") {
      router.replace(`/rooms/${code}`);
    }
  }, [room, loading, code, router]);

  // Show retry button if stuck loading > 5 seconds
  useEffect(() => {
    if (!loading) { setLoadingTooLong(false); return; }
    const t = setTimeout(() => setLoadingTooLong(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading || !room || !user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <motion.div
          className="size-10 rounded-full border-4 border-purple/20 border-t-purple"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <p className="text-muted text-sm">Loading game…</p>
        {loadingTooLong && (
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        )}
      </main>
    );
  }

  const myPlayer = players.find((p) => p.user_id === user.id);
  const isHost = room.host_id === user.id;

  return (
    <main className="min-h-screen bg-background px-4 py-6 pt-8 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-[300px] h-[300px] rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-10 right-10 w-[250px] h-[250px] rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />

      <div className="relative z-10 mx-auto max-w-5xl flex flex-col lg:flex-row gap-4 items-start justify-center">
        {/* ── Game phase panel ── */}
        <div className="w-full max-w-lg mx-auto lg:mx-0 lg:flex-1">
          <AnimatePresence mode="wait">
            {room.phase === "role_reveal" && (
              <motion.div key="role_reveal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineRoleReveal
                  secret={secret}
                  loading={secretLoading}
                  roomId={room.id}
                  isHost={isHost}
                  sendMessage={sendMessage}
                  myDisplayName={myPlayer?.display_name ?? ""}
                  userId={user.id}
                />
              </motion.div>
            )}
            {room.phase === "clue_phase" && (
              <motion.div key="clue_phase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineCluePhase
                  code={code}
                  room={room}
                  players={players}
                  userId={user.id}
                  secret={secret}
                  sendMessage={sendMessage}
                  myDisplayName={myPlayer?.display_name ?? ""}
                />
              </motion.div>
            )}
            {room.phase === "discussion" && (
              <motion.div key="discussion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineDiscussionPhase
                  room={room}
                  players={players}
                  userId={user.id}
                  isHost={isHost}
                  sendMessage={sendMessage}
                  myDisplayName={myPlayer?.display_name ?? ""}
                />
              </motion.div>
            )}
            {room.phase === "voting" && (
              <motion.div key="voting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineVotingPhase
                  code={code}
                  room={room}
                  players={players}
                  userId={user.id}
                />
              </motion.div>
            )}
            {room.phase === "results" && (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OnlineResultsPhase
                  code={code}
                  room={room}
                  players={players}
                  isHost={isHost}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Persistent chat panel ── */}
        <ChatPanel
          messages={messages}
          sendMessage={sendMessage}
          userId={user.id}
          myDisplayName={myPlayer?.display_name ?? "Me"}
          collapsed={chatCollapsed}
          onToggle={() => setChatCollapsed((c) => !c)}
        />
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Reveal — auto-reveals, then 10-second countdown → auto-starts clue phase
// ─────────────────────────────────────────────────────────────────────────────
function OnlineRoleReveal({
  secret,
  loading,
  roomId,
  isHost,
  sendMessage,
  myDisplayName,
  userId,
}: {
  secret: Database["public"]["Tables"]["player_secrets"]["Row"] | null;
  loading: boolean;
  roomId: string;
  isHost: boolean;
  sendMessage: (text: string, userId: string, displayName: string) => void;
  myDisplayName: string;
  userId: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const advancedRef = useRef(false);

  // Auto-reveal after 1.5 s (player can tap early too)
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(t);
  }, [loading]);

  // Start countdown once revealed
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

  // Host auto-advances when countdown hits 0
  useEffect(() => {
    if (countdown !== 0 || !isHost || advancedRef.current) return;
    advancedRef.current = true;
    const supabase = createClient();
    supabase
      .from("rooms")
      .update({ phase: "clue_phase", current_turn_index: 0 })
      .eq("id", roomId)
      .then();
    // Announce in chat
    sendMessage("🎮 Clue phase is starting — give hints that prove you know the word!", "system", "Game");
  }, [countdown, isHost, roomId, sendMessage]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <motion.div
          className="size-8 rounded-full border-4 border-purple/20 border-t-purple mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <p className="text-muted">Getting your role…</p>
      </div>
    );
  }

  const isImpostor = secret?.role === "impostor";

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-foreground mb-6">Your Role</h2>

      {/* 3D card flip */}
      <div
        style={{ perspective: "800px" }}
        className="mx-auto w-full max-w-sm cursor-pointer"
        onClick={() => !revealed && setRevealed(true)}
      >
        <div
          className="relative w-full min-h-[260px]"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)",
            transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
            <Card glow padding="lg" className="h-full flex flex-col items-center justify-center">
              <motion.div className="text-6xl mb-4" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                🔒
              </motion.div>
              <p className="font-heading text-xl text-foreground">Tap to Reveal</p>
              <p className="text-sm text-muted mt-2">Your role is hidden</p>
            </Card>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <Card
              padding="lg"
              className={cn(
                "h-full flex flex-col items-center justify-center",
                isImpostor
                  ? "border-rose/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
                  : "border-purple/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]"
              )}
            >
              {isImpostor ? (
                <>
                  <div className="text-6xl mb-4">🕵️</div>
                  <p className="font-heading text-2xl text-rose mb-2">You are the IMPOSTOR</p>
                  <p className="text-muted">Topic: <span className="text-orange font-medium">{secret?.topic}</span></p>
                  <p className="text-sm text-rose/70 mt-2">You do NOT know the secret word</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">✅</div>
                  <p className="font-heading text-2xl text-purple mb-2">Regular Player</p>
                  <p className="text-muted">Topic: <span className="text-orange font-medium">{secret?.topic}</span></p>
                  <p className="text-foreground mt-2">
                    Secret Word: <span className="text-purple font-bold text-xl">{secret?.secret_word}</span>
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Countdown after reveal */}
      <AnimatePresence>
        {revealed && countdown !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            {countdown > 0 ? (
              <>
                <p className="text-sm text-muted mb-2">Starting clue phase in…</p>
                <div className="relative mx-auto size-16 flex items-center justify-center">
                  <svg className="absolute inset-0 size-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
                    <motion.circle
                      cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                      className="text-purple"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - countdown / 10)}
                      strokeLinecap="round"
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <span className="font-heading text-2xl text-purple">{countdown}</span>
                </div>
                {isHost && <p className="text-xs text-muted mt-2">You will start automatically</p>}
                {!isHost && <p className="text-xs text-muted mt-2">Waiting for clue phase to begin…</p>}
              </>
            ) : (
              <p className="text-sm text-purple font-semibold">Starting…</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clue Phase — popup modal when it's your turn
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
  room: Database["public"]["Tables"]["rooms"]["Row"];
  players: RoomPlayer[];
  userId: string;
  secret: Database["public"]["Tables"]["player_secrets"]["Row"] | null;
  sendMessage: (text: string, userId: string, displayName: string) => void;
  myDisplayName: string;
}) {
  const [clue, setClue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const currentPlayer = players[room.current_turn_index];
  const isMyTurn = currentPlayer?.user_id === userId;
  const announcedRef = useRef<number>(-1);

  // Show popup when it becomes my turn
  useEffect(() => {
    if (isMyTurn) {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [isMyTurn]);

  // Announce next player in chat (only the player whose turn just started)
  useEffect(() => {
    const idx = room.current_turn_index;
    if (idx === announcedRef.current) return;
    const player = players[idx];
    if (!player) return;
    announcedRef.current = idx;
    // Every client does this but we deduplicate by only the CURRENT player sending
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

    // Announce hint in chat
    sendMessage(`🎤 ${myDisplayName} gave the hint "${submittedClue}"!`, "system", "Game");
    if ((data as { allDone?: boolean }).allDone) {
      sendMessage("✅ All hints given — discussion starting!", "system", "Game");
    }

    setClue("");
    setShowPopup(false);
  }

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-foreground mb-1">🎤 Clue Phase</h2>
      <p className="text-sm text-muted mb-6">
        Turn {Math.min(room.current_turn_index + 1, players.length)} of {players.length}
      </p>

      {/* Player turn track */}
      <div className="flex gap-2 justify-center flex-wrap mb-6">
        {players.map((p, i) => (
          <motion.div
            key={p.id}
            className={cn(
              "flex flex-col items-center gap-1 transition-all px-2 py-1 rounded-xl",
              i === room.current_turn_index && "bg-purple/10 ring-2 ring-purple/40",
              i < room.current_turn_index && "opacity-50"
            )}
            animate={i === room.current_turn_index ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Avatar name={p.display_name} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size="sm" />
            <span className="text-xs text-muted truncate max-w-[60px]">{p.display_name}</span>
            {p.clue_text && <span className="text-xs text-purple">✓</span>}
          </motion.div>
        ))}
      </div>

      {/* Waiting card */}
      <Card padding="lg">
        {isMyTurn ? (
          <>
            <p className="font-heading text-xl text-purple mb-2">Your Turn! 🎯</p>
            <p className="text-sm text-muted">Click the button below to enter your hint</p>
            <Button
              variant="primary"
              size="lg"
              className="mt-4 w-full"
              onClick={() => setShowPopup(true)}
            >
              Enter My Hint
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted mb-2">Waiting for</p>
            <p className="font-heading text-xl text-purple">{currentPlayer?.display_name || "…"}</p>
            <p className="text-sm text-muted mt-2">to give their hint ⏳</p>
          </>
        )}
      </Card>

      {/* Clues given so far */}
      {players.some((p) => p.clue_text) && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted mb-3">💬 Hints Given</h3>
          <div className="space-y-2">
            {players
              .filter((p) => p.clue_text)
              .map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-3 py-2">
                  <Avatar name={p.display_name} color={AVATAR_COLORS[players.indexOf(p) % AVATAR_COLORS.length]} size="sm" />
                  <span className="text-sm text-foreground font-medium">{p.display_name}</span>
                  <span className="text-sm text-purple ml-auto">&quot;{p.clue_text}&quot;</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Hint input popup/modal */}
      <AnimatePresence>
        {showPopup && isMyTurn && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowPopup(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            >
              <Card padding="lg" glow className="border-2 border-purple/50 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                <div className="mb-4">
                  <p className="font-heading text-2xl text-purple mb-1">🎯 Your Turn!</p>
                  {secret && (
                    <div className="rounded-xl bg-purple/5 border border-purple/20 px-4 py-3 mt-3 text-left">
                      {secret.role === "impostor" ? (
                        <>
                          <p className="text-xs text-muted uppercase tracking-wider mb-1">Topic</p>
                          <p className="font-semibold text-orange">{secret.topic}</p>
                          <p className="text-xs text-rose/70 mt-2">You don't know the secret word — blend in!</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted uppercase tracking-wider mb-1">Your word</p>
                          <p className="font-bold text-purple text-xl">{secret.secret_word}</p>
                          <p className="text-xs text-muted mt-1">Topic: <span className="text-orange">{secret.topic}</span></p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted mb-3">Give a one-word clue that proves you know the word without giving it away</p>
                <input
                  type="text"
                  value={clue}
                  onChange={(e) => setClue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmitClue()}
                  placeholder="Enter your hint…"
                  maxLength={200}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none focus:border-purple focus:ring-2 focus:ring-purple/30 mb-4 transition-all duration-200"
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowPopup(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    onClick={handleSubmitClue}
                    disabled={!clue.trim()}
                    isLoading={submitting}
                  >
                    Submit Hint
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Discussion Phase — timer auto-advances to voting (no host button needed)
// ─────────────────────────────────────────────────────────────────────────────
function OnlineDiscussionPhase({
  room,
  players,
  userId,
  isHost,
  sendMessage,
  myDisplayName,
}: {
  room: Database["public"]["Tables"]["rooms"]["Row"];
  players: RoomPlayer[];
  userId: string;
  isHost: boolean;
  sendMessage: (text: string, userId: string, displayName: string) => void;
  myDisplayName: string;
}) {
  const settings = room.settings as { discussionTimer?: number } | null;
  const timerDuration = settings?.discussionTimer ?? 60;
  const [seconds, setSeconds] = useState(timerDuration);
  const advancedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Host auto-advances when timer expires
  useEffect(() => {
    if (seconds > 0 || !isHost || advancedRef.current) return;
    advancedRef.current = true;
    const supabase = createClient();
    supabase.from("rooms").update({ phase: "voting" }).eq("id", room.id).then();
    sendMessage("⏰ Time's up — voting has started!", "system", "Game");
  }, [seconds, isHost, room.id, sendMessage]);

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="font-heading text-2xl text-foreground mb-2">💬 Discussion</h2>
        <Timer seconds={seconds} total={timerDuration} size={80} className="mx-auto" />
        {seconds <= 0 && (
          <p className="text-sm text-purple mt-2 font-semibold">Moving to vote…</p>
        )}
      </div>

      <Card padding="md" className="mb-4">
        <h3 className="text-sm font-semibold text-muted mb-3">📝 Hints</h3>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
              <Avatar name={p.display_name} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size="sm" />
              <span className="text-sm text-foreground">{p.display_name}</span>
              <span className="text-sm text-purple ml-auto">&quot;{p.clue_text || "—"}&quot;</span>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-center text-sm text-muted">
        {seconds > 0 ? "🤔 Discuss who the impostor might be" : "⏳ Advancing to voting…"}
      </p>
    </div>
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
}: {
  code: string;
  room: Database["public"]["Tables"]["rooms"]["Row"];
  players: RoomPlayer[];
  userId: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    return (
      <div className="text-center">
        <h2 className="font-heading text-2xl text-foreground mb-4">Vote Submitted ✓</h2>
        <Card padding="lg">
          <motion.div className="text-5xl mb-4" animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            ⏳
          </motion.div>
          <p className="text-muted">Waiting for other players to vote…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-foreground mb-2">🗳️ Cast Your Vote</h2>
      <Timer seconds={seconds} total={30} size={70} className="mx-auto mb-4" />
      <p className="text-sm text-muted mb-6">Who is the impostor? 🕵️</p>

      <div className="space-y-3 mb-6">
        {otherPlayers.map((p) => {
          const pIdx = players.indexOf(p);
          return (
            <motion.button
              key={p.id}
              onClick={() => setSelectedId(p.user_id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all duration-200 cursor-pointer",
                selectedId === p.user_id
                  ? "border-purple bg-purple/10 ring-1 ring-purple/30 shadow-[0_0_16px_rgba(168,85,247,0.15)]"
                  : "border-border bg-card hover:border-purple/30"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Avatar name={p.display_name} color={AVATAR_COLORS[pIdx % AVATAR_COLORS.length]} size="sm" />
              <span className="text-foreground font-medium">{p.display_name}</span>
              {selectedId === p.user_id && <span className="ml-auto text-purple text-lg">✓</span>}
            </motion.button>
          );
        })}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleVote}
        disabled={!selectedId}
        isLoading={submitting}
      >
        Submit Vote
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Results Phase
// ─────────────────────────────────────────────────────────────────────────────
function OnlineResultsPhase({
  code,
  room,
  players,
  isHost,
}: {
  code: string;
  room: Database["public"]["Tables"]["rooms"]["Row"];
  players: RoomPlayer[];
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
      const { data: roundData } = await supabase
        .from("game_rounds")
        .select("*")
        .eq("id", room.current_round_id)
        .single();
      setRound(roundData);

      const { data: voteData } = await supabase
        .from("votes")
        .select("voter_id, voted_for_id")
        .eq("round_id", room.current_round_id);
      setVotes(voteData ?? []);
      setLoading(false);
    }
    fetchResults();
    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.current_round_id]);

  async function handlePlayAgain() {
    const res = await fetch(`/api/rooms/${code}/start`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(
        typeof data === "object" && data && "error" in data
          ? String((data as { error: unknown }).error)
          : "Failed to start new round",
      );
      return;
    }
    router.replace(`/rooms/${code}/play`);
    router.refresh();
  }

  async function handleBackToLobby() {
    await supabase
      .from("rooms")
      .update({ status: "waiting", phase: "lobby" })
      .eq("id", room.id);
    router.push(`/rooms/${code}`);
  }

  if (loading || !round) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Loading results…</p>
      </div>
    );
  }

  const impostorIdSet = new Set(
    [round.impostor_id, round.second_impostor_id].filter(
      (id): id is string => typeof id === "string" && id.length > 0
    )
  );
  const impostors = players.filter((p) => impostorIdSet.has(p.user_id));
  const groupWon = round.winner === "group";

  const voteCounts: Record<string, number> = {};
  for (const v of votes) {
    voteCounts[v.voted_for_id] = (voteCounts[v.voted_for_id] || 0) + 1;
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="text-7xl mb-4">{groupWon ? "🎉" : "🕵️"}</div>
        <h2 className={cn("font-heading text-3xl mb-2", groupWon ? "text-emerald" : "text-rose")}>
          {groupWon ? "Impostor Caught!" : "Impostor Wins!"}
        </h2>
      </motion.div>

      <Card padding="lg" className="mb-6 mt-4">
        <div className="flex flex-col items-center justify-center gap-4 mb-4">
          <p className="text-sm text-muted">{impostors.length > 1 ? "The impostors were" : "The impostor was"}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {impostors.map((imp) => {
              const idx = players.indexOf(imp);
              return (
                <div key={imp.id} className="flex items-center gap-3">
                  <Avatar name={imp.display_name} color={AVATAR_COLORS[idx % AVATAR_COLORS.length] || "#666"} size="lg" />
                  <p className="font-heading text-xl text-rose">{imp.display_name}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t-2 border-border pt-4 mt-4">
          <p className="text-sm text-muted">Topic: <span className="text-orange">{round.topic}</span></p>
          <p className="text-sm text-muted mt-1">
            Secret Word: <span className="text-purple font-bold">{round.secret_word}</span>
          </p>
        </div>
      </Card>

      <Card padding="md" className="mb-6">
        <h3 className="font-heading text-lg text-foreground mb-3">🗳️ Votes</h3>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2",
                impostorIdSet.has(p.user_id) && "bg-rose/10 border-2 border-rose/30"
              )}
            >
              <Avatar name={p.display_name} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size="sm" />
              <span className="text-sm text-foreground font-medium">{p.display_name}</span>
              <span className="ml-auto text-sm text-muted">
                {voteCounts[p.user_id] || 0} vote{(voteCounts[p.user_id] || 0) !== 1 ? "s" : ""}
              </span>
              {impostorIdSet.has(p.user_id) && (
                <span className="text-xs bg-rose/20 text-rose px-2 py-0.5 rounded-full font-bold">IMPOSTOR</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {isHost && (
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={handleBackToLobby}>
            Back to Lobby
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={handlePlayAgain}>
            🔁 Play Again
          </Button>
        </div>
      )}
      {!isHost && (
        <p className="text-sm text-muted">⏳ Waiting for the host to continue…</p>
      )}
    </div>
  );
}
