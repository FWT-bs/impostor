"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
      <main className="min-h-screen bg-background pt-20 pb-12 px-4">
        <div className="mx-auto max-w-lg">
          <h1 className="text-center text-4xl text-teal mb-2">Local Party Mode</h1>
          <p className="text-center text-muted mb-8">
            Pass the device around — everyone plays on one screen
          </p>

          <Card padding="lg" className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Number of Players
            </label>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPlayerCount((c) => Math.max(MIN_PLAYERS, c - 1))}
                disabled={playerCount <= MIN_PLAYERS}
              >
                -
              </Button>
              <span className="font-heading text-3xl text-teal min-w-[3ch] text-center">
                {playerCount}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPlayerCount((c) => Math.min(MAX_PLAYERS, c + 1))}
                disabled={playerCount >= MAX_PLAYERS}
              >
                +
              </Button>
            </div>
          </Card>

          <Card padding="lg" className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Player Names
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

          <Card padding="lg" className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-3">
              Category (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  !selectedCategory
                    ? "border-teal bg-teal/15 text-teal"
                    : "border-border text-muted hover:border-teal/30 hover:text-foreground"
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
                      "rounded-lg border px-3 py-1.5 text-sm transition-colors relative",
                      isSelected
                        ? "border-teal bg-teal/15 text-teal"
                        : isLocked
                          ? "border-amber/30 text-muted/60 hover:border-amber/50"
                          : "border-border text-muted hover:border-teal/30 hover:text-foreground"
                    )}
                  >
                    {isLocked && <span className="mr-1">🔒</span>}
                    {cat}
                    {isPremium && !isLocked && (
                      <span className="ml-1.5 text-[10px] bg-amber/20 text-amber px-1.5 py-0.5 rounded-full font-medium">
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
                  className="text-teal hover:underline"
                >
                  Sign up
                </button>{" "}
                to unlock them.
              </p>
            )}
          </Card>

          <Button
            variant="primary"
            size="lg"
            className="w-full text-lg"
            onClick={handleStart}
          >
            Start Game
          </Button>
        </div>
      </main>

      <Modal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Premium Category"
      >
        <div className="text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <p className="text-foreground">
            <span className="font-heading text-teal">{blockedCategory}</span> is a premium category.
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
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </Modal>
    </>
  );
}
