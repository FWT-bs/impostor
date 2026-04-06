"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useLocalGameStore } from "@/stores/local-game-store";
import { getCategories, getPremiumCategories } from "@/lib/game/words";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;

export default function LocalSetupPage() {
  const router = useRouter();
  const initGame = useLocalGameStore((s) => s.initGame);
  const { user, loading: authLoading } = useAuth();
  const categories = getCategories();
  const premiumCats = getPremiumCategories();

  const isGuest = !user || user.is_anonymous;

  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i + 1}`)
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />

        <div className="mx-auto max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-muted/60 mb-3">Local Game</p>
            <h1 className="font-heading text-4xl text-foreground mb-2">Party Mode</h1>
            <p className="text-sm text-muted">
              Pass the device around — everyone plays on one screen
            </p>
          </motion.div>

          {/* Player count */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card padding="lg" className="mb-5">
              <label className="block text-sm font-semibold text-foreground mb-4">
                Number of Players
              </label>
              <div className="flex items-center gap-5 justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPlayerCount((c) => Math.max(MIN_PLAYERS, c - 1))}
                  disabled={playerCount <= MIN_PLAYERS}
                  className="!rounded-full !size-10 !p-0 flex-shrink-0"
                >
                  −
                </Button>
                <motion.span
                  key={playerCount}
                  className="font-heading text-4xl text-purple min-w-[3ch] text-center"
                  initial={{ scale: 1.25, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {playerCount}
                </motion.span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPlayerCount((c) => Math.min(MAX_PLAYERS, c + 1))}
                  disabled={playerCount >= MAX_PLAYERS}
                  className="!rounded-full !size-10 !p-0 flex-shrink-0"
                >
                  +
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Player names */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
          >
            <Card padding="lg" className="mb-5">
              <label className="block text-sm font-semibold text-foreground mb-3">
                Player Names
              </label>
              <div className="space-y-2.5">
                {Array.from({ length: playerCount }).map((_, i) => (
                  <Input
                    key={i}
                    placeholder={`Player ${i + 1}`}
                    value={names[i]}
                    onChange={(e) => updateName(i, e.target.value)}
                    className="bg-background"
                  />
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Category */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.5 }}
          >
            <Card padding="lg" className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-3">
                Category{" "}
                <span className="text-muted font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition-all duration-200 cursor-pointer",
                    !selectedCategory
                      ? "border-purple/40 bg-purple/12 text-purple"
                      : "border-border text-muted hover:border-purple/25 hover:text-foreground",
                  )}
                >
                  Random
                </button>
                {categories.map((cat) => {
                  const isPremium = premiumCats.has(cat);
                  const isLocked = isPremium && isGuest;
                  const isSelected = selectedCategory === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm transition-all duration-200 relative cursor-pointer flex items-center gap-1.5",
                        isSelected
                          ? "border-purple/40 bg-purple/12 text-purple"
                          : isLocked
                            ? "border-orange/20 text-muted/50 hover:border-orange/35"
                            : "border-border text-muted hover:border-purple/25 hover:text-foreground",
                      )}
                    >
                      {isLocked && (
                        <svg className="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      )}
                      {cat}
                      {isPremium && !isLocked && (
                        <span className="text-[10px] bg-orange/15 text-orange px-1.5 py-0.5 rounded-full font-bold">
                          PRO
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {isGuest && (
                <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
                  <svg className="size-3 shrink-0 text-orange/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Locked categories require a free account.{" "}
                  <button
                    onClick={() => router.push("/signup")}
                    className="text-purple hover:underline cursor-pointer"
                  >
                    Sign up free
                  </button>
                </p>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.5 }}
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStart}
            >
              Start Game
            </Button>
          </motion.div>
        </div>
      </main>

      <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)} title="Premium Category">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange/10 border border-orange/25 flex items-center justify-center mx-auto">
            <svg className="size-8 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-foreground">
            <span className="font-heading text-purple">{blockedCategory}</span> is a premium category.
          </p>
          <p className="text-sm text-muted">
            Create a free account to unlock all premium categories and track your stats.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push("/login")}>
              Log In
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => router.push("/signup")}>
              Sign Up Free
            </Button>
          </div>
          <button
            onClick={() => setShowAuthModal(false)}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </Modal>
    </>
  );
}
