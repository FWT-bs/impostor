"use client";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { PlayingCard } from "@/components/ui/PlayingCard";
import { cn } from "@/lib/utils";
import { useLocalGameStore } from "@/stores/local-game-store";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export default function LocalPlayPage() {
  const router = useRouter();
  const phase = useLocalGameStore((s) => s.phase);
  const playerCount = useLocalGameStore((s) => s.players.length);

  useEffect(() => {
    if (playerCount === 0) router.replace("/local/setup");
  }, [playerCount, router]);

  if (playerCount === 0) return null;

  const mood =
    phase === "voting" || phase === "results" ? "heat" : "brand";

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden px-4 pb-6 pt-5">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[46vh] transition-colors duration-700"
        style={{
          background:
            mood === "heat"
              ? "radial-gradient(60% 100% at 50% 0%, rgba(255,79,69,0.16), transparent 70%)"
              : "radial-gradient(60% 100% at 50% 0%, rgba(53,216,121,0.14), transparent 70%)",
        }}
      />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <motion.div
          key={phase}
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="flex flex-1 flex-col"
        >
          {phase === "role_reveal" && <RoleRevealPhase />}
          {phase === "clue_phase" && <CluePhase />}
          {phase === "voting" && <VotingPhase />}
          {phase === "results" && <ResultsPhase />}
        </motion.div>
      </div>
    </main>
  );
}

/* ================================================================== */
/* Shared pieces                                                       */
/* ================================================================== */

function StepBar({ label, step, total }: { label: string; step: number; total: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-2">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i < step ? "w-5 bg-brand" : "w-1.5 bg-surface-3",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FlipCard({
  up,
  faceUp,
  faceDown,
  className,
}: {
  up: boolean;
  faceUp: ReactNode;
  faceDown: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative [perspective:1600px]", className)}>
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: up ? 180 : 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 130, damping: 17 }}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">{faceDown}</div>
        <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
          {faceUp}
        </div>
      </motion.div>
    </div>
  );
}

/** A card that springs in when `id` changes (a new hand dealt). Re-keyed rather
 *  than wrapped in AnimatePresence so a throttled tab can never leave it stuck
 *  mid-transition. */
function DealtCard({ id, children }: { id: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={id}
      initial={reduce ? false : { x: 70, rotate: 4 }}
      animate={{ x: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="w-[clamp(232px,74vw,300px)]"
    >
      {children}
    </motion.div>
  );
}

const CARD_RATIO = "aspect-[5/7]";

/* ================================================================== */
/* 1. Role reveal — pass the phone, flip your card                     */
/* ================================================================== */

function RoleRevealPhase() {
  const players = useLocalGameStore((s) => s.players);
  const secretWord = useLocalGameStore((s) => s.secretWord);
  const category = useLocalGameStore((s) => s.category);
  const hint = useLocalGameStore((s) => s.hint);
  const setPhase = useLocalGameStore((s) => s.setPhase);

  const [idx, setIdx] = useState(0);
  const [up, setUp] = useState(false);
  const [busy, setBusy] = useState(false);

  const player = players[idx];
  const isImpostor = player.role === "impostor";
  const isLast = idx === players.length - 1;

  function pass() {
    if (busy) return;
    if (isLast) {
      setPhase("clue_phase");
      return;
    }
    // flip face-down first so the next player never sees this role
    setBusy(true);
    setUp(false);
    window.setTimeout(() => {
      setIdx((i) => i + 1);
      setBusy(false);
    }, 320);
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepBar label="Deal" step={idx + 1} total={players.length} />

      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <DealtCard id={player.id}>
          <FlipCard
            up={up}
            className={cn(CARD_RATIO, "w-full")}
            faceDown={<PlayingCard variant="back" className="h-full w-full" />}
            faceUp={
              <PlayingCard
                variant={isImpostor ? "impostor" : "crew"}
                category={category}
                word={secretWord}
                hint={isImpostor ? hint.toLowerCase() : undefined}
                align="center"
                className="h-full w-full"
              />
            }
          />
        </DealtCard>

        <div className="flex min-h-[70px] items-center justify-center text-center">
          {!up ? (
            <div>
              <p className="text-sm text-muted">Pass the phone to</p>
              <h1 className="display text-[32px] leading-tight">{player.name}</h1>
            </div>
          ) : (
            <p className="mx-auto max-w-[300px] text-[15px] leading-relaxed text-muted">
              {isImpostor
                ? "You don't know the word. Blend in, bluff every clue, survive the vote."
                : "Give a clue that proves you know it — without handing it to the impostor."}
            </p>
          )}
        </div>
      </div>

      <div className="pt-2">
        {!up ? (
          <Button
            size="lg"
            className="w-full rounded-full"
            onClick={() => setUp(true)}
            disabled={busy}
          >
            <Icon name="eye" size={18} /> I&apos;m {player.name} — show my card
          </Button>
        ) : (
          <Button
            size="lg"
            variant={isImpostor ? "heat" : "primary"}
            className="w-full rounded-full"
            onClick={pass}
          >
            {isLast ? (
              <>Everyone&apos;s in — start clues <Icon name="arrow" size={18} /></>
            ) : (
              <>Hide &amp; pass on <Icon name="arrow" size={18} /></>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* 2. Clue phase — one word each, around the table                     */
/* ================================================================== */

function CluePhase() {
  const players = useLocalGameStore((s) => s.players);
  const turn = useLocalGameStore((s) => s.currentTurnIndex);
  const advanceTurn = useLocalGameStore((s) => s.advanceTurn);
  const setPhase = useLocalGameStore((s) => s.setPhase);

  const done = turn >= players.length;
  const speaker = players[Math.min(turn, players.length - 1)];

  return (
    <div className="flex flex-1 flex-col">
      <StepBar label="Clues" step={Math.min(turn, players.length)} total={players.length} />

      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
        {players.map((p, i) => (
          <SeatPip
            key={p.id}
            name={p.name}
            state={i < turn ? "done" : i === turn && !done ? "active" : "waiting"}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        {!done ? (
          <>
            <DealtCard id={speaker.id}>
              <PlayingCard
                variant="neutral"
                category="Your turn"
                headline={speaker.name}
                align="center"
                className={cn(CARD_RATIO, "w-full")}
              />
            </DealtCard>
            <p className="mx-auto max-w-[320px] text-center text-[15px] leading-relaxed text-muted">
              Say <span className="font-semibold text-foreground">one word</span> out loud
              about the secret word, then hand the phone on.
            </p>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="text-center"
          >
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand text-brand-ink">
              <Icon name="check" size={26} stroke={2.6} />
            </div>
            <h2 className="display text-[30px]">Every clue is in</h2>
            <p className="mt-1.5 text-sm text-muted">Now decide who was faking it.</p>
          </motion.div>
        )}
      </div>

      <div className="pt-2">
        {!done ? (
          <Button size="lg" className="w-full rounded-full" onClick={advanceTurn}>
            {turn + 1 >= players.length ? (
              <>That was the last clue <Icon name="check" size={18} stroke={2.4} /></>
            ) : (
              <>Next: {players[turn + 1]?.name} <Icon name="arrow" size={18} /></>
            )}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="heat"
            className="w-full rounded-full"
            onClick={() => setPhase("voting")}
          >
            <Icon name="vote" size={18} /> Start the vote
          </Button>
        )}
      </div>
    </div>
  );
}

function SeatPip({
  name,
  state,
}: {
  name: string;
  state: "done" | "active" | "waiting";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
        state === "active"
          ? "bg-brand text-brand-ink"
          : state === "done"
            ? "bg-surface-2 text-muted"
            : "bg-surface text-muted-2",
      )}
    >
      {state === "done" && <Icon name="check" size={11} stroke={3} />}
      <span className="max-w-[84px] truncate">{name}</span>
    </div>
  );
}

/* ================================================================== */
/* 3. Voting — pass the phone, pick a suspect                          */
/* ================================================================== */

function VotingPhase() {
  const players = useLocalGameStore((s) => s.players);
  const submitVote = useLocalGameStore((s) => s.submitVote);
  const resolveVotes = useLocalGameStore((s) => s.resolveVotes);

  const [voterIdx, setVoterIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [pick, setPick] = useState<string | null>(null);

  const voter = players[voterIdx];
  const others = players.filter((p) => p.id !== voter.id);
  const isLast = voterIdx === players.length - 1;

  function lockVote() {
    if (!pick) return;
    submitVote(voter.id, pick);
    if (isLast) {
      resolveVotes();
      return;
    }
    setPick(null);
    setReady(false);
    setVoterIdx((i) => i + 1);
  }

  if (!ready) {
    return (
      <div className="flex flex-1 flex-col">
        <StepBar label="Vote" step={voterIdx + 1} total={players.length} />
        <div className="flex flex-1 flex-col items-center justify-center gap-7">
          <DealtCard id={voter.id}>
            <PlayingCard variant="back" className={cn(CARD_RATIO, "w-full")} />
          </DealtCard>
          <div className="text-center">
            <p className="text-sm text-muted">Pass the phone to</p>
            <h1 className="display text-[32px] leading-tight">{voter.name}</h1>
          </div>
        </div>
        <div className="pt-2">
          <Button size="lg" className="w-full rounded-full" onClick={() => setReady(true)}>
            <Icon name="eye" size={18} /> I&apos;m {voter.name} — cast my vote
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepBar label="Vote" step={voterIdx + 1} total={players.length} />
      <div className="mb-4 mt-4 text-center">
        <h2 className="display text-[26px] leading-tight">Who&apos;s the impostor?</h2>
        <p className="mt-1 text-sm text-muted">{voter.name}, tap a card to accuse</p>
      </div>

      <div className="grid flex-1 grid-cols-2 content-center gap-3">
        {others.map((p) => {
          const picked = pick === p.id;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setPick(p.id)}
              whileTap={{ scale: 0.96 }}
              className="text-left"
            >
              <PlayingCard
                variant={picked ? "impostor" : "neutral"}
                category={picked ? "accused" : "suspect"}
                headline={p.name}
                align="center"
                className={cn(
                  "aspect-[5/6] w-full transition-all duration-200",
                  picked ? "scale-[1.03]" : "opacity-80",
                )}
              />
            </motion.button>
          );
        })}
      </div>

      <div className="pt-3">
        <Button
          size="lg"
          variant="heat"
          className="w-full rounded-full"
          disabled={!pick}
          onClick={lockVote}
        >
          <Icon name="target" size={18} />
          {pick
            ? isLast
              ? "Lock in the final vote"
              : `Lock vote — ${others.find((p) => p.id === pick)?.name}`
            : "Pick a suspect"}
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* 4. Results — flip the impostor, tally the votes                     */
/* ================================================================== */

function ResultsPhase() {
  const players = useLocalGameStore((s) => s.players);
  const winner = useLocalGameStore((s) => s.winner);
  const impostorId = useLocalGameStore((s) => s.impostorId);
  const secretWord = useLocalGameStore((s) => s.secretWord);
  const category = useLocalGameStore((s) => s.category);
  const hint = useLocalGameStore((s) => s.hint);
  const sessionStats = useLocalGameStore((s) => s.sessionStats);
  const playAgain = useLocalGameStore((s) => s.playAgain);
  const resetAll = useLocalGameStore((s) => s.resetAll);
  const router = useRouter();

  const impostor = players.find((p) => p.id === impostorId);
  const crewWon = winner === "group";
  const maxVotes = Math.max(1, ...players.map((p) => p.votesReceived));

  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setFlipped(true), 550);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 mt-1 flex justify-center">
        <Chip tone={crewWon ? "brand" : "heat"} icon={crewWon ? "trophy" : "flame"}>
          {crewWon ? "Crew wins" : "Impostor escapes"}
        </Chip>
      </div>

      <div className="flex flex-col items-center gap-4">
        <FlipCard
          up={flipped}
          className="aspect-[5/7] w-[clamp(200px,56vw,240px)]"
          faceDown={<PlayingCard variant="back" className="h-full w-full" />}
          faceUp={
            <PlayingCard
              variant="impostor"
              category={category}
              headline={impostor?.name ?? "?"}
              hint={hint.toLowerCase()}
              align="center"
              className="h-full w-full"
            />
          }
        />
        <p className="text-center text-[15px] text-muted">
          The word was{" "}
          <span className="font-semibold text-foreground">{secretWord}</span>
        </p>
      </div>

      <div className="mt-5 space-y-1.5">
        {players.map((p) => {
          const isImp = p.id === impostorId;
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2",
                isImp ? "bg-heat text-heat-ink" : "bg-card",
              )}
            >
              <span className="text-[13px] font-semibold">{p.name}</span>
              {isImp && (
                <span className="rounded-full bg-heat-ink/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">
                  Impostor
                </span>
              )}
              <span className="ml-auto flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-16 overflow-hidden rounded-full",
                    isImp ? "bg-heat-ink/25" : "bg-surface-3",
                  )}
                >
                  <span
                    className={cn("block h-full rounded-full", isImp ? "bg-heat-ink" : "bg-brand")}
                    style={{ width: `${(p.votesReceived / maxVotes) * 100}%` }}
                  />
                </span>
                <span className="w-4 text-right text-[12px] font-semibold tabular-nums">
                  {p.votesReceived}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-around rounded-2xl bg-card px-2 py-3 text-center">
        <Stat label="Rounds" value={sessionStats.rounds} />
        <Stat label="Crew" value={sessionStats.groupWins} tone="brand" />
        <Stat label="Impostor" value={sessionStats.impostorWins} tone="heat" />
      </div>

      <div className="mt-5 flex gap-2 pt-1">
        <Button size="lg" className="flex-1 rounded-full" onClick={playAgain}>
          <Icon name="play" size={17} fill /> Play again
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="rounded-full px-5"
          onClick={() => {
            resetAll();
            router.push("/local/setup");
          }}
          aria-label="New game"
        >
          <Icon name="refresh" size={17} />
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "brand" | "heat";
}) {
  return (
    <div>
      <p
        className={cn(
          "display text-[26px] leading-none",
          tone === "brand" && "text-brand",
          tone === "heat" && "text-heat",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-muted">{label}</p>
    </div>
  );
}
