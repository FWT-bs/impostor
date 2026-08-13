"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { useLocalGameStore } from "@/stores/local-game-store";
import { tokenColor } from "@/lib/utils";

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
    <main className="reveal-wrap">
      <div className="reveal-inner">
        {store.phase === "role_reveal" && <RoleRevealPhase />}
        {store.phase === "clue_phase" && <SpeakingPhase />}
        {store.phase === "voting" && <VotingPhase />}
        {store.phase === "results" && <ResultsPhase />}
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
  const last = currentIdx + 1 >= players.length;

  function handleNext() {
    setRevealed(false);
    if (last) setPhase("clue_phase");
    else setCurrentIdx(currentIdx + 1);
  }

  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <Chip icon="users" tone="brand">{topic} · pass &amp; play</Chip>
        <span className="text-[13px] font-semibold text-muted">
          {currentIdx + 1} / {players.length}
        </span>
      </div>

      {!revealed ? (
        <div key={`h${currentIdx}`} className="pop-in flex flex-col items-center gap-5 py-8 text-center">
          <p className="kicker">Pass the phone to</p>
          <Avatar name={player.name} color={tokenColor(player.id)} size="xl" />
          <h1 className="display text-[46px] leading-tight">{player.name}</h1>
          <p className="max-w-[300px] text-[15px] text-muted">No peeking, this one is yours only</p>
          <Button variant="primary" size="lg" onClick={() => setRevealed(true)}>
            <Icon name="eye" size={18} /> I&apos;m {player.name}. Reveal my role
          </Button>
        </div>
      ) : (
        <RoleCard key={`r${currentIdx}`} isImpostor={isImpostor} secret={secretWord} topic={topic} onNext={handleNext} last={last} />
      )}
    </div>
  );
}

function RoleCard({ isImpostor, secret, topic, onNext, last }: { isImpostor: boolean; secret: string; topic: string; onNext: () => void; last: boolean }) {
  const c = isImpostor ? "var(--heat)" : "var(--aqua)";
  return (
    <div className="flex flex-col items-center gap-6 py-2.5">
      <div
        className="role-card pop-in"
        style={{ ["--c" as string]: c, borderColor: `color-mix(in oklab, ${c} 50%, transparent)` }}
      >
        <div className="role-ic" style={{ background: c }}>
          <Icon name={isImpostor ? "mask" : "shield"} size={40} />
        </div>
        {isImpostor ? (
          <>
            <p className="kicker" style={{ color: "var(--heat-2)" }}>You are the</p>
            <h2 className="display" style={{ fontSize: 46, color: "var(--heat)" }}>IMPOSTER</h2>
            <p className="mx-auto mt-1 max-w-[320px] text-[14.5px] text-muted">No secret word, blend in and survive the vote</p>
            <div className="role-chip">
              <span className="kicker" style={{ fontSize: 10 }}>Your only hint: the topic</span>
              <span className="display" style={{ fontSize: 34, color: "var(--amber)" }}>{topic}</span>
            </div>
          </>
        ) : (
          <>
            <p className="kicker" style={{ color: "var(--aqua-2)" }}>You are</p>
            <h2 className="display" style={{ fontSize: 46, color: "var(--aqua)" }}>CREW</h2>
            <p className="mx-auto mt-1 max-w-[320px] text-[14.5px] text-muted">You know the word, clue carefully</p>
            <div className="role-chip">
              <span className="kicker" style={{ fontSize: 10 }}>The secret word</span>
              <span className="display" style={{ fontSize: 38, color: "var(--text)" }}>{secret}</span>
              <span className="text-[12px] text-muted">Topic · {topic}</span>
            </div>
          </>
        )}
      </div>
      <Button variant={isImpostor ? "heat" : "primary"} size="lg" onClick={onNext}>
        {last ? <>Everyone is ready. Start clues <Icon name="arrow" size={18} /></> : <>Got it. Pass it on <Icon name="arrow" size={18} /></>}
      </Button>
    </div>
  );
}

function SpeakingPhase() {
  const { players, currentTurnIndex, advanceTurn, setPhase } = useLocalGameStore();
  const currentPlayer = players[currentTurnIndex];
  const allDone = currentTurnIndex >= players.length;

  if (allDone) {
    return (
      <div className="card card-pad">
        <div className="mb-4 text-center">
          <Chip icon="chat" tone="aqua" className="mb-3">All clues in</Chip>
          <h2 className="text-[22px]">Everyone has spoken</h2>
          <p className="mt-1 text-sm text-muted">Who felt suspicious</p>
        </div>
        <div className="mb-5 flex flex-col gap-2">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg px-3.5 py-2.5" style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,.015)" }}>
              <span className="w-5 text-xs text-muted">{i + 1}.</span>
              <Avatar name={p.name} color={tokenColor(p.id)} size="sm" />
              <span className="text-[14px] font-semibold">{p.name}</span>
              <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: "var(--emerald)" }}>
                <Icon name="check" size={13} stroke={2.6} /> spoke
              </span>
            </div>
          ))}
        </div>
        <Button variant="heat" size="lg" className="w-full" onClick={() => setPhase("voting")}>
          <Icon name="vote" size={18} /> Start voting
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <Chip icon="chat" tone="aqua" className="mb-3">Clue round</Chip>
        <p className="text-sm text-muted">Player {currentTurnIndex + 1} of {players.length}</p>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-3">
        {players.map((p, i) => (
          <div key={p.id} className="flex flex-col items-center gap-1.5" style={{ opacity: i < currentTurnIndex ? 0.5 : 1 }}>
            <div className="relative">
              <Avatar name={p.name} color={tokenColor(p.id)} size="md" />
              {i === currentTurnIndex && <span className="absolute rounded-lg" style={{ inset: -4, border: "2px solid var(--aqua)" }} />}
            </div>
            <span className="max-w-[60px] truncate text-[11px] text-muted">{p.name}</span>
          </div>
        ))}
      </div>

      <div className="role-card" style={{ ["--c" as string]: "var(--aqua)", borderColor: "color-mix(in oklab, var(--aqua) 45%, transparent)" }}>
        <div className="role-ic" style={{ background: "var(--aqua)" }}>
          <Icon name="chat" size={38} />
        </div>
        <p className="kicker" style={{ color: "var(--aqua-2)" }}>It&apos;s your turn to speak</p>
        <h2 className="display" style={{ fontSize: 44 }}>{currentPlayer.name}</h2>
        <p className="mx-auto mt-2 max-w-[320px] text-[14px] text-muted">
          One word out loud, enough to prove it, not enough to give it away
        </p>
      </div>

      <Button variant="primary" size="lg" className="mt-6 w-full" onClick={advanceTurn}>
        {currentTurnIndex + 1 >= players.length ? <>Done. Everyone has spoken <Icon name="check" size={18} stroke={2.4} /></> : <>Next: {players[currentTurnIndex + 1]?.name} <Icon name="arrow" size={18} /></>}
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
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <Chip icon="vote" tone="heat">Voting</Chip>
        <p className="kicker">Pass the device to</p>
        <Avatar name={voter.name} color={tokenColor(voter.id)} size="xl" />
        <h2 className="display text-[44px] leading-tight">{voter.name}</h2>
        <p className="text-sm text-muted">Voter {currentVoterIdx + 1} of {players.length}</p>
        <Button variant="primary" size="lg" onClick={() => setShowPass(false)}>
          <Icon name="eye" size={18} /> I&apos;m ready to vote
        </Button>
      </div>
    );
  }

  const otherPlayers = players.filter((p) => p.id !== voter.id);

  return (
    <div className="card card-pad">
      <div className="mb-5 text-center">
        <h2 className="text-[20px]">Who&apos;s the impostor?</h2>
        <p className="mt-1 text-sm text-muted">{voter.name}, tap someone to vote</p>
      </div>

      <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
        {otherPlayers.map((p) => {
          const picked = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className="vote-card"
              style={{ borderColor: picked ? "var(--heat)" : "var(--border)", background: picked ? "color-mix(in oklab, var(--heat) 12%, transparent)" : "var(--surface)" }}
            >
              <Avatar name={p.name} color={tokenColor(p.id)} size="md" />
              <span className="text-[14px] font-bold">{p.name}</span>
              {picked && <span className="chip chip-heat absolute right-2 top-2" style={{ fontSize: 9 }}>Your vote</span>}
            </button>
          );
        })}
      </div>

      <Button variant="heat" size="lg" className="w-full" onClick={handleVoteSubmit} disabled={!selectedId}>
        <Icon name="target" size={18} /> {selectedId ? `Lock vote for ${otherPlayers.find((p) => p.id === selectedId)?.name}` : "Pick someone to vote"}
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
    <div className="card card-pad">
      <div className="pop-in flex flex-col items-center gap-4 text-center">
        <Chip tone={groupWon ? "aqua" : "heat"} icon={groupWon ? "trophy" : "flame"}>
          {groupWon ? "Crew wins" : "Impostor escapes"}
        </Chip>
        <div className="role-ic" style={{ width: 84, height: 84, background: "var(--heat)" }}>
          <Icon name="mask" size={42} />
        </div>
        <div>
          <p className="kicker" style={{ color: "var(--heat-2)" }}>The impostor was</p>
          <h2 className="display" style={{ fontSize: 56, color: "var(--heat)" }}>{impostor?.name}</h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="result-stat">
            <span className="kicker" style={{ fontSize: 9 }}>Secret word</span>
            <span className="display text-[26px]" style={{ color: "var(--aqua-2)" }}>{secretWord}</span>
          </div>
          <div className="result-stat">
            <span className="kicker" style={{ fontSize: 9 }}>Topic</span>
            <span className="display text-[26px]" style={{ color: "var(--amber)" }}>{topic}</span>
          </div>
        </div>

        {/* votes */}
        <div className="mt-2 w-full">
          <p className="kicker mb-3 text-center">Votes</p>
          <div className="flex flex-col gap-2">
            {players.map((p) => {
              const isImp = p.id === impostorId;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg px-3.5 py-2.5"
                  style={{
                    border: isImp ? "1px solid color-mix(in oklab, var(--heat) 40%, transparent)" : "1px solid var(--border)",
                    background: isImp ? "color-mix(in oklab, var(--heat) 10%, transparent)" : "rgba(255,255,255,.015)",
                  }}
                >
                  <Avatar name={p.name} color={tokenColor(p.id)} size="sm" role={isImp ? "impostor" : undefined} />
                  <span className="text-[14px] font-semibold">{p.name}</span>
                  <span className="flex-1" />
                  <span className="text-[13px] text-muted">{p.votesReceived} vote{p.votesReceived !== 1 ? "s" : ""}</span>
                  {isImp && <span className="chip chip-heat" style={{ fontSize: 9 }}>Impostor</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* session stats */}
        <div className="mt-2 flex w-full justify-around">
          <div className="result-stat">
            <span className="display text-[26px]" style={{ color: "var(--brand-2)" }}>{sessionStats.rounds}</span>
            <span className="kicker" style={{ fontSize: 9 }}>Rounds</span>
          </div>
          <div className="result-stat">
            <span className="display text-[26px]" style={{ color: "var(--emerald)" }}>{sessionStats.groupWins}</span>
            <span className="kicker" style={{ fontSize: 9 }}>Crew wins</span>
          </div>
          <div className="result-stat">
            <span className="display text-[26px]" style={{ color: "var(--heat)" }}>{sessionStats.impostorWins}</span>
            <span className="kicker" style={{ fontSize: 9 }}>Impostor wins</span>
          </div>
        </div>

        <div className="mt-2 flex w-full flex-wrap justify-center gap-2">
          <Button variant="primary" size="lg" onClick={playAgain}>
            <Icon name="play" size={17} fill /> Play again
          </Button>
          <Button variant="secondary" size="lg" onClick={() => { resetAll(); router.push("/local/setup"); }}>
            <Icon name="refresh" size={17} /> New game
          </Button>
        </div>
      </div>
    </div>
  );
}
