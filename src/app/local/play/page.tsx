"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useLocalGameStore } from "@/stores/local-game-store";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
];

export default function LocalPlayPage() {
  const router = useRouter();
  const store = useLocalGameStore();

  useEffect(() => {
    if (store.players.length === 0) {
      router.replace("/local/setup");
    }
  }, [store.players.length, router]);

  if (store.players.length === 0) return null;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {store.phase === "role_reveal" && (
            <motion.div key="role_reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RoleRevealPhase />
            </motion.div>
          )}
          {store.phase === "clue_phase" && (
            <motion.div key="clue_phase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SpeakingPhase />
            </motion.div>
          )}
          {store.phase === "voting" && (
            <motion.div key="voting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <VotingPhase />
            </motion.div>
          )}
          {store.phase === "results" && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsPhase />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function RoleRevealPhase() {
  const { players, setPhase, secretWord, topic } = useLocalGameStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const player = players[currentIdx];
  const isImpostor = player.role === "impostor";

  function handleNext() {
    setRevealed(false);
    if (currentIdx + 1 >= players.length) {
      setPhase("clue_phase");
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  }

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-muted mb-2">
        Pass to <span className="text-teal">{player.name}</span>
      </h2>
      <p className="text-sm text-muted mb-8">
        Player {currentIdx + 1} of {players.length} — everyone else look away!
      </p>

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
                className="cursor-pointer min-h-[240px] flex flex-col items-center justify-center"
                onClick={() => setRevealed(true)}
              >
                <div className="text-5xl mb-4">🔒</div>
                <p className="font-heading text-xl text-foreground">Tap to Reveal Your Role</p>
                <p className="text-sm text-muted mt-2">Make sure only you can see the screen</p>
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
                  "min-h-[240px] flex flex-col items-center justify-center",
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
                      Topic: <span className="text-amber font-medium">{topic}</span>
                    </p>
                    <p className="text-sm text-danger/70 mt-2">
                      You do NOT know the secret word. Bluff!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-4">✅</div>
                    <p className="font-heading text-2xl text-teal mb-2">
                      You are a Regular Player
                    </p>
                    <p className="text-muted">
                      Topic: <span className="text-amber font-medium">{topic}</span>
                    </p>
                    <p className="text-foreground mt-2">
                      Secret Word: <span className="text-teal font-bold text-xl">{secretWord}</span>
                    </p>
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {revealed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button variant="primary" size="lg" className="mt-6 w-full" onClick={handleNext}>
            {currentIdx + 1 >= players.length ? "Everyone Has Seen — Start!" : "Pass to Next Player"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function SpeakingPhase() {
  const { players, currentTurnIndex, advanceTurn, setPhase } = useLocalGameStore();
  const currentPlayer = players[currentTurnIndex];
  const allDone = currentTurnIndex >= players.length;

  if (allDone) {
    return (
      <div className="text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-5xl mb-4">💬</div>
          <h2 className="font-heading text-2xl text-foreground mb-2">Everyone Has Spoken!</h2>
          <p className="text-muted mb-4">
            Discuss amongst yourselves — who was being suspicious?
          </p>
          <p className="text-sm text-muted mb-8">
            When you&apos;re ready, start voting.
          </p>
        </motion.div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted mb-3">Turn Order</h3>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-xs text-muted w-5">{i + 1}.</span>
                <Avatar name={p.name} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size="sm" />
                <span className="text-sm text-foreground font-medium">{p.name}</span>
                <span className="text-xs text-success ml-auto">spoke</span>
              </div>
            ))}
          </div>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={() => setPhase("voting")}>
          Start Voting
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-foreground mb-1">Speaking Round</h2>
      <p className="text-sm text-muted mb-6">
        Player {currentTurnIndex + 1} of {players.length}
      </p>

      <div className="flex gap-2 justify-center flex-wrap mb-6">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "flex flex-col items-center gap-1 transition-all px-2 py-1 rounded-lg",
              i === currentTurnIndex && "bg-teal/10 ring-1 ring-teal/40",
              i < currentTurnIndex && "opacity-50"
            )}
          >
            <Avatar name={p.name} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size="sm" />
            <span className="text-xs text-muted truncate max-w-[60px]">{p.name}</span>
            {i < currentTurnIndex && <span className="text-xs text-success">✓</span>}
          </div>
        ))}
      </div>

      <Card padding="lg" glow>
        <div className="text-4xl mb-3">🎤</div>
        <p className="text-sm text-muted mb-1">It&apos;s your turn to speak</p>
        <p className="font-heading text-3xl text-teal mb-4">{currentPlayer.name}</p>
        <p className="text-muted text-sm leading-relaxed">
          Say <span className="text-foreground font-medium">one word or short phrase</span> out
          loud that proves you know the secret word — without making it too obvious!
        </p>
      </Card>

      <Button variant="primary" size="lg" className="mt-6 w-full" onClick={advanceTurn}>
        {currentTurnIndex + 1 >= players.length ? "Done — Everyone Has Spoken" : `Next: ${players[currentTurnIndex + 1]?.name}`}
      </Button>
    </div>
  );
}

function VotingPhase() {
  const { players, submitVote, resolveVotes } = useLocalGameStore();
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(true);

  const voter = players[currentVoterIdx];

  const handleVoteSubmit = useCallback(() => {
    if (!selectedId || !voter) return;
    submitVote(voter.id, selectedId);
    setSelectedId(null);

    if (currentVoterIdx + 1 >= players.length) {
      resolveVotes();
    } else {
      setCurrentVoterIdx(currentVoterIdx + 1);
      setShowPass(true);
    }
  }, [selectedId, voter, submitVote, currentVoterIdx, players.length, resolveVotes]);

  if (!voter) return null;

  if (showPass) {
    return (
      <div className="text-center">
        <h2 className="font-heading text-2xl text-foreground mb-2">Voting Phase</h2>
        <p className="text-muted mb-6">Pass the device to</p>
        <p className="font-heading text-3xl text-teal mb-6">{voter.name}</p>
        <p className="text-sm text-muted mb-6">
          Voter {currentVoterIdx + 1} of {players.length}
        </p>
        <Button variant="primary" size="lg" className="w-full" onClick={() => setShowPass(false)}>
          I&apos;m Ready to Vote
        </Button>
      </div>
    );
  }

  const otherPlayers = players.filter((p) => p.id !== voter.id);

  return (
    <div className="text-center">
      <h2 className="font-heading text-2xl text-foreground mb-1">Cast Your Vote</h2>
      <p className="text-muted mb-6">{voter.name}, who is the impostor?</p>

      <div className="space-y-3 mb-6">
        {otherPlayers.map((p) => {
          const pIdx = players.indexOf(p);
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg border px-4 py-3 transition-all",
                selectedId === p.id
                  ? "border-teal bg-teal/10 ring-1 ring-teal/40"
                  : "border-border bg-card hover:border-teal/30"
              )}
            >
              <Avatar name={p.name} color={AVATAR_COLORS[pIdx % AVATAR_COLORS.length]} size="sm" />
              <span className="text-foreground font-medium">{p.name}</span>
              {selectedId === p.id && <span className="ml-auto text-teal">✓</span>}
            </button>
          );
        })}
      </div>

      <Button variant="primary" size="lg" className="w-full" onClick={handleVoteSubmit} disabled={!selectedId}>
        Submit Vote
      </Button>
    </div>
  );
}

function ResultsPhase() {
  const { players, winner, impostorId, secretWord, topic, sessionStats, playAgain, resetAll } = useLocalGameStore();
  const router = useRouter();
  const impostor = players.find((p) => p.id === impostorId);

  const groupWon = winner === "group";

  return (
    <div className="text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <div className="text-6xl mb-4">{groupWon ? "🎉" : "🕵️"}</div>
        <h2 className={cn("font-heading text-3xl mb-2", groupWon ? "text-success" : "text-danger")}>
          {groupWon ? "Impostor Caught!" : "Impostor Wins!"}
        </h2>
        <p className="text-muted mb-6">
          {groupWon
            ? "The group successfully identified the impostor."
            : "The impostor fooled everyone!"}
        </p>
      </motion.div>

      <Card padding="lg" className="mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Avatar
            name={impostor?.name || "?"}
            color={AVATAR_COLORS[players.indexOf(impostor!) % AVATAR_COLORS.length] || "#666"}
            size="lg"
          />
          <div className="text-left">
            <p className="text-sm text-muted">The Impostor was</p>
            <p className="font-heading text-xl text-danger">{impostor?.name}</p>
          </div>
        </div>
        <div className="border-t border-border pt-4 mt-4">
          <p className="text-sm text-muted">
            Topic: <span className="text-amber">{topic}</span>
          </p>
          <p className="text-sm text-muted mt-1">
            Secret Word: <span className="text-teal font-bold">{secretWord}</span>
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
                p.id === impostorId && "bg-danger/10 border border-danger/30"
              )}
            >
              <Avatar name={p.name} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size="sm" />
              <span className="text-sm text-foreground font-medium">{p.name}</span>
              <span className="ml-auto text-sm text-muted">
                {p.votesReceived} vote{p.votesReceived !== 1 ? "s" : ""}
              </span>
              {p.id === impostorId && (
                <span className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded">IMPOSTOR</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card padding="md" className="mb-6">
        <h3 className="font-heading text-lg text-foreground mb-2">Session Stats</h3>
        <div className="flex justify-around text-center">
          <div>
            <p className="font-heading text-2xl text-teal">{sessionStats.rounds}</p>
            <p className="text-xs text-muted">Rounds</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-success">{sessionStats.groupWins}</p>
            <p className="text-xs text-muted">Group Wins</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-danger">{sessionStats.impostorWins}</p>
            <p className="text-xs text-muted">Impostor Wins</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => { resetAll(); router.push("/local/setup"); }}
        >
          New Game
        </Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={playAgain}>
          Play Again
        </Button>
      </div>
    </div>
  );
}
