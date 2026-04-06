"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

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
      <main className="min-h-screen bg-background pt-28 pb-20 px-4 relative overflow-hidden">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,108,206,0.07) 0%, transparent 70%)",
          }}
        />

        <div className="mx-auto max-w-3xl relative z-10">
          {/* Hero */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted mb-5 font-medium">
              Social Deduction
            </p>
            <h1 className="font-heading text-5xl sm:text-7xl text-foreground tracking-wider mb-5">
              IMPOSTOR
            </h1>
            <p className="text-base text-muted max-w-md mx-auto leading-relaxed">
              One player doesn&apos;t know the secret word. Find them before
              they blend in.
            </p>
          </motion.div>

          {/* Mode cards */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-14">
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card hover padding="lg" className="h-full flex flex-col">
                <div className="text-2xl mb-4" aria-hidden>
                  📱
                </div>
                <h2 className="font-heading text-xl text-foreground mb-2">
                  Local Party
                </h2>
                <p className="text-sm text-muted mb-6 flex-1 leading-relaxed">
                  Pass one device around the table. Perfect for game night.
                  3–10 players.
                </p>
                <Button variant="primary" size="md" className="w-full" asChild>
                  <Link href="/local/setup">Play Local</Link>
                </Button>
              </Card>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card hover padding="lg" className="h-full flex flex-col">
                <div className="text-2xl mb-4" aria-hidden>
                  🌐
                </div>
                <h2 className="font-heading text-xl text-foreground mb-2">
                  Online Multiplayer
                </h2>
                <p className="text-sm text-muted mb-6 flex-1 leading-relaxed">
                  Create or join a room. Everyone uses their own device with
                  real-time sync.
                </p>
                <Button variant="secondary" size="md" className="w-full" asChild>
                  <Link href="/rooms">Play Online</Link>
                </Button>
              </Card>
            </motion.div>
          </div>

          {/* How to play */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card padding="lg" className="max-w-2xl mx-auto">
              <h2 className="font-heading text-base uppercase tracking-[0.2em] text-muted mb-8 text-center">
                How it works
              </h2>
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                {[
                  {
                    step: "01",
                    title: "Get Roles",
                    desc: "Everyone gets the secret word — except the impostor, who only knows the topic.",
                  },
                  {
                    step: "02",
                    title: "Give Clues",
                    desc: "Take turns with a one-word clue. Prove you know the word without giving it away.",
                  },
                  {
                    step: "03",
                    title: "Vote",
                    desc: "Discuss and vote. Catch the impostor and the group wins.",
                  },
                ].map((s) => (
                  <div key={s.step} className="group">
                    <p className="font-heading text-xs tracking-[0.25em] text-purple/60 mb-2">
                      {s.step}
                    </p>
                    <h3 className="font-heading text-base text-foreground mb-2">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Auth CTA */}
          {!loading && !user && (
            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-sm text-muted mb-4">
                Create an account to track stats and climb the leaderboard.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
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
