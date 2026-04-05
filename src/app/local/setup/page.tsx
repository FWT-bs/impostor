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
      <main className="min-h-screen bg-background pt-20 pb-12 px-4 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-[300px] h-[300px] rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-20 left-10 w-[250px] h-[250px] rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />

        <div className="mx-auto max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <h1 className="text-center font-heading text-4xl bg-gradient-to-r from-purple to-cyan bg-clip-text text-transparent mb-2">
              📱 Local Party Mode
            </h1>
            <p className="text-center text-muted mb-8">
              Pass the device around — everyone plays on one screen
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card padding="lg" className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-3">
                👥 Number of Players
              </label>
              <div className="flex items-center gap-4 justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPlayerCount((c) => Math.max(MIN_PLAYERS, c - 1))}
                  disabled={playerCount <= MIN_PLAYERS}
                  className="!rounded-full !size-10 !p-0"
                >
                  −
                </Button>
                <motion.span
                  key={playerCount}
                  className="font-heading text-4xl text-purple min-w-[3ch] text-center"
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {playerCount}
                </motion.span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPlayerCount((c) => Math.min(MAX_PLAYERS, c + 1))}
                  disabled={playerCount >= MAX_PLAYERS}
                  className="!rounded-full !size-10 !p-0"
                >
                  +
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="lg" className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-3">
                ✏️ Player Names
              </label>
              <div className="space-y-3">
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

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card padding="lg" className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-3">
                🏷️ Category (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "rounded-full border-2 px-4 py-1.5 text-sm transition-all duration-200 cursor-pointer",
                    !selectedCategory
                      ? "border-purple bg-purple/15 text-purple shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                      : "border-border text-muted hover:border-purple/30 hover:text-foreground"
                  )}
                >
                  🎲 Random
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
                        "rounded-full border-2 px-4 py-1.5 text-sm transition-all duration-200 relative cursor-pointer",
                        isSelected
                          ? "border-purple bg-purple/15 text-purple shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                          : isLocked
                            ? "border-orange/30 text-muted/60 hover:border-orange/50"
                            : "border-border text-muted hover:border-purple/30 hover:text-foreground"
                      )}
                    >
                      {isLocked && <span className="mr-1">🔒</span>}
                      {cat}
                      {isPremium && !isLocked && (
                        <span className="ml-1.5 text-[10px] bg-orange/20 text-orange px-2 py-0.5 rounded-full font-bold">
                          PRO
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {isGuest && (
                <p className="text-xs text-muted mt-3">
                  🔒 categories require a free account.{" "}
                  <button
                    onClick={() => router.push("/signup")}
                    className="text-purple hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>{" "}
                  to unlock them.
                </p>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full text-lg"
              onClick={handleStart}
            >
              🚀 Start Game
            </Button>
          </motion.div>
        </div>
      </main>

      <Modal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="🔒 Premium Category"
      >
        <div className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <p className="text-foreground">
            <span className="font-heading text-purple">{blockedCategory}</span> is a premium category.
          </p>
          <p className="text-sm text-muted">
            Create a free account to unlock all premium categories.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => router.push("/login")}
            >
              Log In
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => router.push("/signup")}
            >
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
