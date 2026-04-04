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

export default function OnlinePlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { room, players, loading } = useRoom(code);
  const { secret, loading: secretLoading } = usePlayerSecret(
    room?.current_round_id ?? null
  );
  const { messages, sendMessage } = useChat(room?.id ?? null);

  useEffect(() => {
    if (!loading && room && room.phase === "lobby") {
      router.replace(`/rooms/${code}`);
    }
  }, [room, loading, code, router]);

  if (loading || !room || !user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted">Loading game...</p>
      </main>
    );
  }

  const myPlayer = players.find((p) => p.user_id === user.id);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {room.phase === "role_reveal" && (
            <motion.div key="role_reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OnlineRoleReveal
                secret={secret}
                loading={secretLoading}
                code={code}
                isHost={room.host_id === user.id}
              />
            </motion.div>
          )}
          {room.phase === "clue_phase" && (
            <motion.div key="clue_phase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OnlineCluePhase
                code={code}
                room={room}
                players={players}
                userId={user.id}
              />
            </motion.div>
          )}
          {room.phase === "discussion" && (
            <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OnlineDiscussionPhase
                room={room}
                players={players}
                userId={user.id}
                myDisplayName={myPlayer?.display_name ?? "Player"}
                messages={messages}
                sendMessage={sendMessage}
                code={code}
                isHost={room.host_id === user.id}
              />
            </motion.div>
          )}
          {room.phase === "voting" && (
            <motion.div key="voting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OnlineVotingPhase
                code={code}
                room={room}
                players={players}
                userId={user.id}
              />
            </motion.div>
          )}
          {room.phase === "results" && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OnlineResultsPhase
                code={code}
                room={room}
                players={players}
                isHost={room.host_id === user.id}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function OnlineRoleReveal({
  secret,
  loading,
  code,
  isHost,
}: {
  secret: Database["public"]["Tables"]["player_secrets"]["Row"] | null;
  loading: boolean;
  code: string;
  isHost: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  async function handleReady() {
    if (isHost) {
      const supabase = createClient();
      const { data: room } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", code.toUpperCase())
        .single();
      if (room) {
        await supabase
          .from("rooms")
          .update({ phase: "clue_phase", current_turn_index: 0 })
          .eq("id", room.id);
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <p className="text-muted">Loading your role...</p>
      </div>
    );
  }

  const isImpostor = secret?.role === "impostor";

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-foreground mb-6">Your Role</h2>

      <div className="perspective-[600px]">
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="hidden"
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            >
              <Card
                glow
                padding="lg"
                className="cursor-pointer min-h-[220px] flex flex-col items-center justify-center"
                onClick={() => setRevealed(true)}
              >
                <div className="text-5xl mb-4">🔒</div>
                <p className="font-heading text-xl text-foreground">
                  Tap to Reveal
                </p>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            >
              <Card
                padding="lg"
                className={cn(
                  "min-h-[220px] flex flex-col items-center justify-center",
                  isImpostor ? "border-danger/50" : "border-teal/50"
                )}
              >
                {isImpostor ? (
                  <>
                    <div className="text-5xl mb-4">🕵️</div>
                    <p className="font-heading text-2xl text-danger mb-2">
                      You are the IMPOSTOR
                    </p>
                    <p className="text-muted">
                      Topic:{" "}
                      <span className="text-amber font-medium">
                        {secret?.topic}
                      </span>
                    </p>
                    <p className="text-sm text-danger/70 mt-2">
                      You do NOT know the secret word
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-4">✅</div>
                    <p className="font-heading text-2xl text-teal mb-2">
                      Regular Player
                    </p>
                    <p className="text-muted">
                      Topic:{" "}
                      <span className="text-amber font-medium">
                        {secret?.topic}
                      </span>
                    </p>
                    <p className="text-foreground mt-2">
                      Secret Word:{" "}
                      <span className="text-teal font-bold text-xl">
                        {secret?.secret_word}
                      </span>
                    </p>
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {revealed && isHost && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="primary"
            size="lg"
            className="mt-6 w-full"
            onClick={handleReady}
          >
            Start Clue Phase
          </Button>
        </motion.div>
      )}
      {revealed && !isHost && (
        <p className="mt-6 text-sm text-muted">
          Waiting for the host to start the clue phase...
        </p>
      )}
    </div>
  );
}

function OnlineCluePhase({
  code,
  room,
  players,
  userId,
}: {
  code: string;
  room: Database["public"]["Tables"]["rooms"]["Row"];
  players: Database["public"]["Tables"]["room_players"]["Row"][];
  userId: string;
}) {
  const [clue, setClue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const currentPlayer = players[room.current_turn_index];
  const isMyTurn = currentPlayer?.user_id === userId;

  async function handleSubmitClue() {
    if (!clue.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/rooms/${code}/clue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clue: clue.trim() }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to submit clue");
    }
    setClue("");
  }

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-foreground mb-1">Clue Phase</h2>
      <p className="text-sm text-muted mb-6">
        Turn {Math.min(room.current_turn_index + 1, players.length)} of{" "}
        {players.length}
      </p>

      <div className="flex gap-2 justify-center flex-wrap mb-6">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "flex flex-col items-center gap-1 transition-all px-2 py-1 rounded-lg",
              i === room.current_turn_index && "bg-teal/10 ring-1 ring-teal/40",
              i < room.current_turn_index && "opacity-50"
            )}
          >
            <Avatar
              name={p.display_name}
              color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
              size="sm"
            />
            <span className="text-xs text-muted truncate max-w-[60px]">
              {p.display_name}
            </span>
            {p.clue_text && <span className="text-xs text-teal">&#10003;</span>}
          </div>
        ))}
      </div>

      <Card padding="lg">
        {isMyTurn ? (
          <>
            <p className="font-heading text-xl text-teal mb-4">Your Turn!</p>
            <p className="text-sm text-muted mb-4">
              Give a clue that proves you know the word
            </p>
            <input
              type="text"
              value={clue}
              onChange={(e) => setClue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitClue()}
              placeholder="Enter your clue..."
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-teal focus:ring-1 focus:ring-teal/40 mb-4"
              autoFocus
            />
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSubmitClue}
              disabled={!clue.trim()}
              isLoading={submitting}
            >
              Submit Clue
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted mb-2">Waiting for</p>
            <p className="font-heading text-xl text-teal">
              {currentPlayer?.display_name || "..."}
            </p>
            <p className="text-sm text-muted mt-2">to give their clue</p>
          </>
        )}
      </Card>

      {players.some((p) => p.clue_text) && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted mb-3">Clues Given</h3>
          <div className="space-y-2">
            {players
              .filter((p) => p.clue_text)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <Avatar
                    name={p.display_name}
                    color={
                      AVATAR_COLORS[
                        players.indexOf(p) % AVATAR_COLORS.length
                      ]
                    }
                    size="sm"
                  />
                  <span className="text-sm text-foreground font-medium">
                    {p.display_name}
                  </span>
                  <span className="text-sm text-teal ml-auto">
                    &quot;{p.clue_text}&quot;
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OnlineDiscussionPhase({
  room,
  players,
  userId,
  myDisplayName,
  messages,
  sendMessage,
  code,
  isHost,
}: {
  room: Database["public"]["Tables"]["rooms"]["Row"];
  players: Database["public"]["Tables"]["room_players"]["Row"][];
  userId: string;
  myDisplayName: string;
  messages: { id: string; userId: string; displayName: string; text: string; timestamp: number }[];
  sendMessage: (text: string, userId: string, displayName: string) => void;
  code: string;
  isHost: boolean;
}) {
  const settings = room.settings as { discussionTimer?: number } | null;
  const timerDuration = settings?.discussionTimer ?? 60;
  const [seconds, setSeconds] = useState(timerDuration);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim(), userId, myDisplayName);
    setChatInput("");
  }

  async function handleAdvanceToVoting() {
    const supabase = createClient();
    const { data: roomData } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code.toUpperCase())
      .single();
    if (roomData) {
      await supabase
        .from("rooms")
        .update({ phase: "voting" })
        .eq("id", roomData.id);
    }
  }

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="font-heading text-2xl text-foreground mb-2">
          Discussion
        </h2>
        <Timer seconds={seconds} total={timerDuration} size={80} className="mx-auto" />
      </div>

      <Card padding="md" className="mb-4">
        <h3 className="text-sm font-medium text-muted mb-3">Clues</h3>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5"
            >
              <Avatar
                name={p.display_name}
                color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                size="sm"
              />
              <span className="text-sm text-foreground">{p.display_name}</span>
              <span className="text-sm text-teal ml-auto">
                &quot;{p.clue_text || "—"}&quot;
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="md" className="mb-4">
        <h3 className="text-sm font-medium text-muted mb-3">Chat</h3>
        <div className="h-40 overflow-y-auto space-y-2 mb-3 pr-1">
          {messages.length === 0 && (
            <p className="text-xs text-muted text-center py-4">
              No messages yet
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "text-sm rounded-lg px-3 py-1.5",
                msg.userId === userId
                  ? "bg-teal/10 text-foreground ml-8"
                  : "bg-card-hover text-foreground mr-8"
              )}
            >
              <span className="font-medium text-teal text-xs">
                {msg.displayName}
              </span>
              <p>{msg.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-teal"
          />
          <Button variant="primary" size="sm" onClick={handleSend}>
            Send
          </Button>
        </div>
      </Card>

      {isHost && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleAdvanceToVoting}
        >
          {seconds <= 0 ? "Time's Up — Start Voting!" : "Skip to Voting"}
        </Button>
      )}
      {!isHost && (
        <p className="text-center text-sm text-muted">
          {seconds <= 0
            ? "Waiting for host to start voting..."
            : "Discuss who the impostor might be"}
        </p>
      )}
    </div>
  );
}

function OnlineVotingPhase({
  code,
  room,
  players,
  userId,
}: {
  code: string;
  room: Database["public"]["Tables"]["rooms"]["Row"];
  players: Database["public"]["Tables"]["room_players"]["Row"][];
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
    toast.success("Vote submitted!");
  }

  const otherPlayers = players.filter((p) => p.user_id !== userId);

  if (hasVoted) {
    return (
      <div className="text-center">
        <h2 className="font-heading text-2xl text-foreground mb-4">
          Vote Submitted
        </h2>
        <Card padding="lg">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-muted">
            Waiting for other players to vote...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-foreground mb-2">
        Cast Your Vote
      </h2>
      <Timer seconds={seconds} total={30} size={70} className="mx-auto mb-4" />
      <p className="text-sm text-muted mb-6">Who is the impostor?</p>

      <div className="space-y-3 mb-6">
        {otherPlayers.map((p) => {
          const pIdx = players.indexOf(p);
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.user_id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg border px-4 py-3 transition-all",
                selectedId === p.user_id
                  ? "border-teal bg-teal/10 ring-1 ring-teal/40"
                  : "border-border bg-card hover:border-teal/30"
              )}
            >
              <Avatar
                name={p.display_name}
                color={AVATAR_COLORS[pIdx % AVATAR_COLORS.length]}
                size="sm"
              />
              <span className="text-foreground font-medium">
                {p.display_name}
              </span>
              {selectedId === p.user_id && (
                <span className="ml-auto text-teal">&#10003;</span>
              )}
            </button>
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

function OnlineResultsPhase({
  code,
  room,
  players,
  isHost,
}: {
  code: string;
  room: Database["public"]["Tables"]["rooms"]["Row"];
  players: Database["public"]["Tables"]["room_players"]["Row"][];
  isHost: boolean;
}) {
  const supabase = createClient();
  const [round, setRound] = useState<GameRound | null>(null);
  const [votes, setVotes] = useState<
    { voter_id: string; voted_for_id: string }[]
  >([]);
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
  }, [room.current_round_id, supabase]);

  async function handlePlayAgain() {
    const res = await fetch(`/api/rooms/${code}/start`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to start new round");
    }
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
      <div className="text-center">
        <p className="text-muted">Loading results...</p>
      </div>
    );
  }

  const impostor = players.find((p) => p.user_id === round.impostor_id);
  const groupWon = round.winner === "group";

  const voteCounts: Record<string, number> = {};
  for (const v of votes) {
    voteCounts[v.voted_for_id] = (voteCounts[v.voted_for_id] || 0) + 1;
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="text-6xl mb-4">{groupWon ? "🎉" : "🕵️"}</div>
        <h2
          className={cn(
            "font-heading text-3xl mb-2",
            groupWon ? "text-success" : "text-danger"
          )}
        >
          {groupWon ? "Impostor Caught!" : "Impostor Wins!"}
        </h2>
      </motion.div>

      <Card padding="lg" className="mb-6 mt-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Avatar
            name={impostor?.display_name || "?"}
            color={
              AVATAR_COLORS[
                players.indexOf(impostor!) % AVATAR_COLORS.length
              ] || "#666"
            }
            size="lg"
          />
          <div className="text-left">
            <p className="text-sm text-muted">The Impostor was</p>
            <p className="font-heading text-xl text-danger">
              {impostor?.display_name}
            </p>
          </div>
        </div>
        <div className="border-t border-border pt-4 mt-4">
          <p className="text-sm text-muted">
            Topic: <span className="text-amber">{round.topic}</span>
          </p>
          <p className="text-sm text-muted mt-1">
            Secret Word:{" "}
            <span className="text-teal font-bold">{round.secret_word}</span>
          </p>
        </div>
      </Card>

      <Card padding="md" className="mb-6">
        <h3 className="font-heading text-lg text-foreground mb-3">Votes</h3>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                p.user_id === round.impostor_id &&
                  "bg-danger/10 border border-danger/30"
              )}
            >
              <Avatar
                name={p.display_name}
                color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                size="sm"
              />
              <span className="text-sm text-foreground font-medium">
                {p.display_name}
              </span>
              <span className="ml-auto text-sm text-muted">
                {voteCounts[p.user_id] || 0} vote
                {(voteCounts[p.user_id] || 0) !== 1 ? "s" : ""}
              </span>
              {p.user_id === round.impostor_id && (
                <span className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded">
                  IMPOSTOR
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {isHost && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={handleBackToLobby}
          >
            Back to Lobby
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handlePlayAgain}
          >
            Play Again
          </Button>
        </div>
      )}
      {!isHost && (
        <p className="text-sm text-muted">
          Waiting for the host to continue...
        </p>
      )}
    </div>
  );
}
