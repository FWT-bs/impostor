"use client";

import {
  AppShell,
  DoodleMark,
  GameCard,
  HowItWorksStrip,
  PageHeader,
  PlayerToken,
  SetupStepper,
  StatusBadge,
  TopicPackGrid,
} from "@/components/game";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { getCategories, getPremiumCategories } from "@/lib/game/words";
import { loginWithNext, signupWithNext } from "@/lib/auth-path";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLocalGameStore } from "@/stores/local-game-store";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;

const STEPS = [
  { label: "Number of players", description: "Set the seats" },
  { label: "Player names", description: "Name the table" },
  { label: "Topic pack", description: "Pick the clue lane" },
  { label: "Start round", description: "Deal the roles" },
];

export default function LocalSetupPage() {
  const router = useRouter();
  const pathname = usePathname();
  const initGame = useLocalGameStore((s) => s.initGame);
  const { user } = useAuth();
  const categories = useMemo(() => getCategories(), []);
  const premiumCats = useMemo(() => getPremiumCategories(), []);

  const isGuest = !user || user.is_anonymous;

  const [activeStep, setActiveStep] = useState(0);
  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i + 1}`),
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [blockedCategory, setBlockedCategory] = useState<string | null>(null);

  function updateName(index: number, value: string) {
    setActiveStep(1);
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleCategoryClick(cat: string | null) {
    setActiveStep(2);
    if (cat && premiumCats.has(cat) && isGuest) {
      setBlockedCategory(cat);
      setShowAuthModal(true);
      return;
    }
    setSelectedCategory((current) => (current === cat ? null : cat));
  }

  function handleStart() {
    const activeNames = names
      .slice(0, playerCount)
      .map((name, index) => name.trim() || `Player ${index + 1}`);
    initGame(activeNames, selectedCategory);
    router.push("/local/play");
  }

  return (
    <AppShell mainClassName="max-w-7xl">
      <section className="relative grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <DoodleMark kind="eye" className="left-[52%] top-12 hidden lg:block" color="var(--aqua)" size={42} />
        <DoodleMark kind="shh" className="left-[67%] top-28 hidden lg:block" color="var(--heat)" size={48} rotate={8} />
        <div>
          <PageHeader
            eyebrow={<><Icon name="users" size={15} /> Pass & Play</>}
            title={
              <>
                Set tonight&apos;s <span className="scribble-word" style={{ "--scribble-color": "var(--brand)" } as CSSProperties}>table</span>
              </>
            }
            description="Seats, names, topic pack, hidden roles"
          />

          <div className="grid gap-4">
          <SetupSection
            step={1}
            title="Number of players"
            text="Three to ten seats, one impostor dealt in secret"
            active={activeStep === 0}
            onFocus={() => setActiveStep(0)}
          >
            <div className="flex items-center justify-center gap-6 rounded-2xl border border-border bg-card/65 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.26)]">
              <button
                type="button"
                onClick={() => {
                  setActiveStep(0);
                  setPlayerCount((count) => Math.max(MIN_PLAYERS, count - 1));
                }}
                disabled={playerCount <= MIN_PLAYERS}
                className="step-btn"
                aria-label="Decrease players"
              >
                <Icon name="minus" size={18} />
              </button>
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={playerCount}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                    className="display block text-5xl text-foreground"
                  >
                    {playerCount}
                  </motion.span>
                </AnimatePresence>
                <p className="text-sm font-semibold text-muted">players seated</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveStep(0);
                  setPlayerCount((count) => Math.min(MAX_PLAYERS, count + 1));
                }}
                disabled={playerCount >= MAX_PLAYERS}
                className="step-btn"
                aria-label="Increase players"
              >
                <Icon name="plus" size={18} />
              </button>
            </div>
          </SetupSection>

          <SetupSection
            step={2}
            title="Player names"
            text="Player tokens, seat labels, no spreadsheet feeling"
            active={activeStep === 1}
            onFocus={() => setActiveStep(1)}
          >
            <motion.div layout className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: playerCount }).map((_, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PlayerToken
                    editable
                    index={index}
                    name={names[index]}
                    value={names[index]}
                    onChange={(event) => updateName(index, event.target.value)}
                    active={index === 0}
                  />
                </motion.div>
              ))}
            </motion.div>
          </SetupSection>

          <SetupSection
            step={3}
            title="Topic pack"
            text="Random for chaos, premium packs marked before the round"
            active={activeStep === 2}
            onFocus={() => setActiveStep(2)}
          >
            <TopicPackGrid
              packs={categories}
              premiumPacks={premiumCats}
              selected={selectedCategory}
              lockedWhenPremium={isGuest}
              onSelect={handleCategoryClick}
            />
            {isGuest && (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Icon name="lock" size={14} className="text-heat-2" />
                Locked packs need an account.{" "}
                <button
                  type="button"
                  onClick={() => router.push(signupWithNext(pathname))}
                  className="cursor-pointer font-semibold text-brand-2 transition-colors hover:text-foreground"
                >
                  Sign up free
                </button>
              </p>
            )}
          </SetupSection>

          <SetupSection
            step={4}
            title="Start round"
            text="Pass clockwise, reveal only when each player is ready"
            active={activeStep === 3}
            onFocus={() => setActiveStep(3)}
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="rounded-2xl border border-border bg-card/65 p-4">
                <p className="text-sm font-semibold text-foreground">Ready to deal roles</p>
                <p className="mt-1 text-sm text-muted">
                  {playerCount} players / {selectedCategory || "Random pack"} / 1 impostor
                </p>
              </div>
              <Button size="lg" onClick={handleStart}>
                <Icon name="play" size={18} fill /> Start round
              </Button>
            </div>
          </SetupSection>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <RoundPreviewImage />
          <GameCard accent="cyan" className="p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <Badge variant="cyan">Tonight&apos;s table</Badge>
                <h2 className="mt-3 text-2xl font-bold">Round preview</h2>
              </div>
              <StatusBadge status="open">Local</StatusBadge>
            </div>
            <div className="grid gap-3">
              <PreviewRow label="Players" value={String(playerCount)} />
              <PreviewRow label="Topic pack" value={selectedCategory || "Random"} />
              <PreviewRow label="Impostors" value="1" />
            </div>
            <div className="mt-5 rounded-2xl border border-border bg-card/65 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Seats</p>
              <div className="grid gap-2">
                {names.slice(0, playerCount).map((name, index) => (
                  <PlayerToken key={index} name={name} index={index} className="p-2" />
                ))}
              </div>
            </div>
            <div className="mt-5">
              <SetupStepper steps={STEPS} active={activeStep} />
            </div>
          </GameCard>
        </aside>
      </section>

      <section className="mt-8">
        <HowItWorksStrip mode="setup" />
      </section>

      <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)} title="Premium topic pack">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-lg border border-heat/40 bg-heat/12 text-heat-2">
            <Icon name="crown" size={30} />
          </div>
          <p className="text-foreground">
            <span className="font-bold text-brand-2">{blockedCategory}</span> is locked right now
          </p>
          <p className="text-sm text-muted">Free account, premium packs, stats kept safe</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push(loginWithNext(pathname))}>Log in</Button>
            <Button className="flex-1" onClick={() => router.push(signupWithNext(pathname))}>Sign up free</Button>
          </div>
          <button onClick={() => setShowAuthModal(false)} className="cursor-pointer text-sm text-muted transition-colors hover:text-foreground">
            Maybe later
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}

function RoundPreviewImage() {
  return (
    <div className="art-frame setup-art-frame mb-5">
      <Image
        src="/assets/round-preview-panel.png"
        alt="Round preview showing four seats around one hidden impostor"
        width={1024}
        height={1536}
        sizes="(min-width: 1024px) 38vw, 92vw"
        className="reference-art setup-preview-art"
      />
    </div>
  );
}

function SetupSection({
  step,
  title,
  text,
  active,
  onFocus,
  children,
}: {
  step: number;
  title: string;
  text: string;
  active: boolean;
  onFocus: () => void;
  children: ReactNode;
}) {
  return (
    <GameCard
      accent={active ? "purple" : "cyan"}
      className="p-5 sm:p-6"
      onMouseEnter={onFocus}
      onFocus={onFocus}
    >
      <div className="mb-5 flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-lg font-black text-white shadow-[0_8px_18px_rgba(24,185,100,0.22)]">
          {step}
        </span>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
        </div>
      </div>
      {children}
    </GameCard>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card/65 px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
