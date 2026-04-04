"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  const { user, profile, loading } = useAuth();

  return (
    <>
      <Header
        user={
          profile
            ? { username: profile.username, avatarColor: profile.avatar_color }
            : null
        }
      />
      <main className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-6xl sm:text-7xl text-teal tracking-wider mb-4">
              IMPOSTOR
            </h1>
            <p className="text-lg sm:text-xl text-muted max-w-xl mx-auto leading-relaxed">
              A social deduction party game. One player is the impostor who
              doesn&apos;t know the secret word. Find them before they blend in.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card hover padding="lg" className="h-full flex flex-col">
                <div className="text-4xl mb-4">📱</div>
                <h2 className="font-heading text-2xl text-foreground mb-2">
                  Local Party
                </h2>
                <p className="text-sm text-muted mb-6 flex-1">
                  Pass one device around. Perfect for game night with friends
                  in the same room. 3-10 players.
                </p>
                <Button variant="primary" size="lg" className="w-full" asChild>
                  <Link href="/local/setup">Play Local</Link>
                </Button>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card hover padding="lg" className="h-full flex flex-col">
                <div className="text-4xl mb-4">🌐</div>
                <h2 className="font-heading text-2xl text-foreground mb-2">
                  Online Multiplayer
                </h2>
                <p className="text-sm text-muted mb-6 flex-1">
                  Create or join a room. Play with friends remotely. Everyone
                  uses their own device. Real-time sync.
                </p>
                <Button variant="primary" size="lg" className="w-full" asChild>
                  <Link href="/rooms">Play Online</Link>
                </Button>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card padding="lg" className="max-w-2xl mx-auto">
              <h2 className="font-heading text-2xl text-foreground mb-4 text-center">
                How to Play
              </h2>
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-2">🎭</div>
                  <h3 className="font-heading text-lg text-teal mb-1">Get Roles</h3>
                  <p className="text-sm text-muted">
                    Everyone gets the secret word except the impostor, who only
                    knows the topic.
                  </p>
                </div>
                <div>
                  <div className="text-3xl mb-2">💬</div>
                  <h3 className="font-heading text-lg text-teal mb-1">Give Clues</h3>
                  <p className="text-sm text-muted">
                    Take turns saying a clue that proves you know the word —
                    but don&apos;t make it too obvious!
                  </p>
                </div>
                <div>
                  <div className="text-3xl mb-2">🗳️</div>
                  <h3 className="font-heading text-lg text-teal mb-1">Vote</h3>
                  <p className="text-sm text-muted">
                    Discuss and vote on who the impostor is. Catch them and the
                    group wins!
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {!loading && !user && (
            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-muted mb-4">
                Create an account to track your stats and climb the leaderboard
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="primary" asChild>
                  <Link href="/signup">Create Account</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}
