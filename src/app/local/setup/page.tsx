"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { useLocalGameStore } from "@/stores/local-game-store";
import { getCategories, getPremiumCategories } from "@/lib/game/words";
import { useAuth } from "@/lib/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { loginWithNext, signupWithNext } from "@/lib/auth-path";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;

export default function LocalSetupPage() {
  const router = useRouter();
  const pathname = usePathname();
  const initGame = useLocalGameStore((s) => s.initGame);
  const { user } = useAuth();
  const categories = getCategories();
  const premiumCats = getPremiumCategories();

  const isGuest = !user || user.is_anonymous;

  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i + 1}`),
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [blockedCategory, setBlockedCategory] = useState<string | null>(null);

  function updateName(index: number, value: string) {
    setNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleCategoryClick(cat: string) {
    if (premiumCats.has(cat) && isGuest) {
      setBlockedCategory(cat);
      setShowAuthModal(true);
      return;
    }
    setSelectedCategory(selectedCategory === cat ? null : cat);
  }

  function handleStart() {
    const activeNames = names.slice(0, playerCount).map((n, i) => n.trim() || `Player ${i + 1}`);
    initGame(activeNames, selectedCategory);
    router.push("/local/play");
  }

  function chipStyle(active: boolean): React.CSSProperties {
    return {
      cursor: "pointer",
      fontSize: 12.5,
      padding: "8px 14px",
      color: active ? "var(--brand-ink)" : "var(--text)",
      background: active ? "var(--brand)" : "rgba(255,255,255,.02)",
      borderColor: active ? "var(--brand)" : "var(--border)",
    };
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[560px] px-5 pt-28 pb-20">
        <div className="mb-1.5">
          <Chip tone="brand" icon="users">Pass &amp; play</Chip>
        </div>
        <h1 className="mb-7" style={{ fontSize: "clamp(30px,5vw,44px)" }}>Set up your party</h1>

        <div className="flex flex-col gap-4">
          {/* Player count */}
          <div className="card card-pad">
            <p className="mb-3.5 text-[13px] font-semibold uppercase" style={{ fontFamily: "var(--font-head)", color: "var(--muted)", letterSpacing: ".06em" }}>
              Number of players · {playerCount}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setPlayerCount((c) => Math.max(MIN_PLAYERS, c - 1))} disabled={playerCount <= MIN_PLAYERS} className="step-btn">
                <Icon name="minus" size={18} />
              </button>
              <span className="display min-w-[40px] text-center text-[40px]" style={{ color: "var(--brand-2)" }}>{playerCount}</span>
              <button onClick={() => setPlayerCount((c) => Math.min(MAX_PLAYERS, c + 1))} disabled={playerCount >= MAX_PLAYERS} className="step-btn">
                <Icon name="plus" size={18} />
              </button>
            </div>
          </div>

          {/* Player names */}
          <div className="card card-pad">
            <p className="mb-3 text-[13px] font-semibold uppercase" style={{ fontFamily: "var(--font-head)", color: "var(--muted)", letterSpacing: ".06em" }}>
              Player names
            </p>
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: playerCount }).map((_, i) => (
                <Input key={i} placeholder={`Player ${i + 1}`} value={names[i]} onChange={(e) => updateName(i, e.target.value)} />
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="card card-pad">
            <p className="mb-3 text-[13px] font-semibold uppercase" style={{ fontFamily: "var(--font-head)", color: "var(--muted)", letterSpacing: ".06em" }}>
              Topic pack <span className="font-normal normal-case tracking-normal" style={{ color: "var(--muted-2)" }}>(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedCategory(null)} className="chip" style={chipStyle(!selectedCategory)}>
                <Icon name="dice" size={11} /> Random
              </button>
              {categories.map((cat) => {
                const isPremium = premiumCats.has(cat);
                const isLocked = isPremium && isGuest;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className="chip"
                    style={
                      isLocked && !isSelected
                        ? { cursor: "pointer", fontSize: 12.5, padding: "8px 14px", color: "var(--amber)", borderColor: "color-mix(in oklab, var(--amber) 35%, transparent)" }
                        : chipStyle(isSelected)
                    }
                  >
                    {isLocked && <Icon name="lock" size={11} />}
                    {cat}
                    {isPremium && !isLocked && <Icon name="crown" size={11} style={{ color: isSelected ? "var(--brand-ink)" : "var(--amber)" }} />}
                  </button>
                );
              })}
            </div>
            {isGuest && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                <Icon name="lock" size={12} style={{ color: "var(--amber)" }} />
                Locked packs need a free account.{" "}
                <button onClick={() => router.push(signupWithNext(pathname))} className="cursor-pointer" style={{ color: "var(--brand-2)" }}>
                  Sign up free
                </button>
              </p>
            )}
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={handleStart}>
            <Icon name="play" size={18} fill /> Start game
          </Button>
          <p className="text-center text-[12.5px] text-muted">One impostor will be chosen at random.</p>
        </div>
      </main>

      <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)} title="Premium topic pack">
        <div className="space-y-4 text-center">
          <div className="role-ic mx-auto" style={{ width: 64, height: 64, ["--c" as string]: "var(--amber)", background: "linear-gradient(150deg, var(--amber), color-mix(in oklab, var(--amber) 55%, #000))" }}>
            <Icon name="crown" size={30} />
          </div>
          <p className="text-foreground">
            <span className="display" style={{ color: "var(--brand-2)" }}>{blockedCategory}</span> is a premium pack.
          </p>
          <p className="text-sm text-muted">Create a free account to unlock premium packs and track your stats.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push(loginWithNext(pathname))}>Log in</Button>
            <Button variant="primary" className="flex-1" onClick={() => router.push(signupWithNext(pathname))}>Sign up free</Button>
          </div>
          <button onClick={() => setShowAuthModal(false)} className="cursor-pointer text-sm text-muted transition-colors hover:text-foreground">
            Maybe later
          </button>
        </div>
      </Modal>
    </>
  );
}
