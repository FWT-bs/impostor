"use client";

import {
  AppShell,
  DoodleMark,
  GameCard,
  PageHeader,
  PlayerToken,
  StatusBadge,
  TopicPackGrid,
} from "@/components/game";
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

export default function LocalSetupPage() {
  const router = useRouter();
  const pathname = usePathname();
  const initGame = useLocalGameStore((s) => s.initGame);
  const { user, profile } = useAuth();
  const categories = useMemo(() => getCategories(), []);
  const premiumCats = useMemo(() => getPremiumCategories(), []);

  const isGuest = !user || user.is_anonymous;
  const hasPremium = profile?.is_premium ?? false;

  const [activeStep, setActiveStep] = useState(0);
  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i + 1}`),
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [blockedCategory, setBlockedCategory] = useState<string | null>(null);
  const [helpCard, setHelpCard] = useState<"players" | "names" | "topics" | "start" | "preview" | null>(null);

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
    if (cat && premiumCats.has(cat) && !hasPremium) {
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
      <section className="relative grid items-start gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <DoodleMark kind="eye" className="left-[52%] top-12 hidden lg:block" color="var(--aqua)" size={42} />
        <DoodleMark kind="shh" className="left-[67%] top-28 hidden lg:block" color="var(--heat)" size={48} rotate={8} />
        <div>
          <PageHeader
            title={
              <>
                Set tonight&apos;s <span className="scribble-word" style={{ "--scribble-color": "var(--brand)" } as CSSProperties}>table</span>
              </>
            }
          />

          <div className="grid gap-4">
          <SetupSection
            title="Number of players"
            text="Three to ten seats"
            active={activeStep === 0}
            onFocus={() => setActiveStep(0)}
            onHelp={() => setHelpCard("players")}
          >
            <div className="flex items-center justify-center gap-4 rounded-2xl border border-border bg-card/65 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.26)] sm:gap-6 sm:p-6">
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
                    className="display block text-4xl text-foreground sm:text-5xl"
                  >
                    {playerCount}
                  </motion.span>
                </AnimatePresence>
                <p className="text-xs font-semibold text-muted sm:text-sm">players seated</p>
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
            title="Player names"
            text="Names for the table"
            active={activeStep === 1}
            onFocus={() => setActiveStep(1)}
            onHelp={() => setHelpCard("names")}
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
            title="Topic pack"
            text="Pick a lane"
            active={activeStep === 2}
            onFocus={() => setActiveStep(2)}
            onHelp={() => setHelpCard("topics")}
          >
            <TopicPackGrid
              packs={categories}
              premiumPacks={premiumCats}
              selected={selectedCategory}
              lockedWhenPremium={!hasPremium}
              onSelect={handleCategoryClick}
            />
            {!hasPremium && (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Icon name="crown" size={14} className="text-heat-2" />
                Locked packs live in Imposter+.{" "}
                <button
                  type="button"
                  onClick={() => router.push(isGuest ? signupWithNext(pathname) : "/pricing")}
                  className="cursor-pointer font-semibold text-brand-2 transition-colors hover:text-foreground"
                >
                  Unlock packs
                </button>
              </p>
            )}
          </SetupSection>

          <SetupSection
            title="Start round"
            text="Deal when everyone's set"
            active={activeStep === 3}
            onFocus={() => setActiveStep(3)}
            onHelp={() => setHelpCard("start")}
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="rounded-2xl border border-border bg-card/65 p-4">
                <p className="text-sm font-semibold text-foreground">Ready to deal roles</p>
                <p className="mt-1 text-sm text-muted">
                  {playerCount} players / {selectedCategory || "Random pack"} / 1 impostor
                </p>
              </div>
              <Button size="lg" className="w-full sm:w-auto" onClick={handleStart}>
                <Icon name="play" size={18} fill /> Start round
              </Button>
            </div>
          </SetupSection>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <RoundPreviewImage />
          <GameCard accent="cyan" className="relative p-5">
            <HelpButton onClick={() => setHelpCard("preview")} />
            <div className="mb-5 flex items-center justify-between gap-3 pr-10">
              <h2 className="text-2xl font-bold">Round preview</h2>
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
          </GameCard>
        </aside>
      </section>

      <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)} title="Imposter+">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-lg border border-heat/40 bg-heat/12 text-heat-2">
            <Icon name="crown" size={30} />
          </div>
          <p className="text-foreground">
            Unlock <span className="font-bold text-brand-2">{blockedCategory}</span>
          </p>
          <p className="text-sm text-muted">More packs, saved stats, regular table perks</p>
          {isGuest ? (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => router.push(loginWithNext(pathname))}>Log in</Button>
              <Button className="flex-1" onClick={() => router.push(signupWithNext(pathname))}>Sign up free</Button>
            </div>
          ) : (
            <Button className="w-full bg-brand text-black hover:bg-brand-2" onClick={() => router.push("/pricing")}>
              Unlock packs <Icon name="arrow" size={17} />
            </Button>
          )}
          <button onClick={() => setShowAuthModal(false)} className="cursor-pointer text-sm text-muted transition-colors hover:text-foreground">
            Maybe later
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(helpCard)} onClose={() => setHelpCard(null)} title="Quick help">
        <div className="space-y-4">
          {helpCard === "players" && (
            <>
              <p>Pick how many seats are in tonight&apos;s round.</p>
              <p className="text-muted">Three is the minimum. Bigger tables feel messier, louder, and a little trickier.</p>
            </>
          )}
          {helpCard === "names" && (
            <>
              <p>Type the names you want on the role cards.</p>
              <p className="text-muted">Seat order matters because the device gets passed around in that same order.</p>
            </>
          )}
          {helpCard === "topics" && (
            <>
              <p>Pick one pack or leave it on Random.</p>
              <p className="text-muted">Crew sees the category and the word. The impostor only sees the category.</p>
            </>
          )}
          {helpCard === "start" && (
            <>
              <p>Press start, then pass the device around the table.</p>
              <p className="text-muted">Each player checks their card privately, then the clue round begins.</p>
            </>
          )}
          {helpCard === "preview" && (
            <>
              <p>This panel is just a quick snapshot of the round you&apos;re building.</p>
              <p className="text-muted">Player count, pack, impostor count, and seat order update as you change things.</p>
            </>
          )}
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
        alt="Round preview with three crew players and one red impostor around a hidden role circle"
        width={1024}
        height={1536}
        sizes="(min-width: 1024px) 38vw, 92vw"
        className="reference-art setup-preview-art"
      />
    </div>
  );
}

function SetupSection({
  title,
  text,
  active,
  onFocus,
  onHelp,
  children,
}: {
  title: string;
  text: string;
  active: boolean;
  onFocus: () => void;
  onHelp: () => void;
  children: ReactNode;
}) {
  return (
    <GameCard
      accent={active ? "purple" : "cyan"}
      className="relative p-5 sm:p-6"
      onMouseEnter={onFocus}
      onFocus={onFocus}
    >
      <HelpButton onClick={onHelp} />
      <div className="mb-5 flex items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
        </div>
      </div>
      {children}
    </GameCard>
  );
}

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-border bg-background/80 text-muted transition-colors hover:border-brand/40 hover:text-foreground"
      aria-label="Open quick help"
    >
      <span className="text-base font-black">?</span>
    </button>
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
