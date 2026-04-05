"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";
import { motion } from "framer-motion";

function FloatingBlob({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 1 }}
      aria-hidden
    />
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 30 },
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
      <main className="min-h-screen bg-background pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Decorative background blobs */}
        <FloatingBlob
          className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full bg-purple/5 blur-3xl animate-float pointer-events-none"
          delay={0}
        />
        <FloatingBlob
          className="absolute bottom-20 right-1/4 w-[350px] h-[350px] rounded-full bg-cyan/5 blur-3xl animate-float pointer-events-none"
          delay={1}
        />
        <FloatingBlob
          className="absolute top-1/2 right-10 w-[250px] h-[250px] rounded-full bg-orange/5 blur-3xl animate-float pointer-events-none"
          delay={2}
        />

        <div className="mx-auto max-w-4xl relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
          >
            <motion.div
              className="text-6xl mb-6"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              🕵️
            </motion.div>
            <h1 className="font-heading text-6xl sm:text-8xl bg-gradient-to-r from-purple via-purple-glow to-cyan bg-clip-text text-transparent tracking-wider mb-4">
              IMPOSTOR
            </h1>
            <p className="text-lg sm:text-xl text-muted max-w-xl mx-auto leading-relaxed">
              A social deduction party game. One player is the impostor who
              doesn&apos;t know the secret word. Find them before they blend in.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
            >
              <Card hover padding="lg" className="h-full flex flex-col group">
                <motion.div
                  className="text-5xl mb-4"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  📱
                </motion.div>
                <h2 className="font-heading text-2xl text-foreground mb-2 group-hover:text-purple transition-colors">
                  Local Party
                </h2>
                <p className="text-sm text-muted mb-6 flex-1 leading-relaxed">
                  Pass one device around. Perfect for game night with friends
                  in the same room. 3–10 players.
                </p>
                <Button variant="primary" size="lg" className="w-full" asChild>
                  <Link href="/local/setup">🎮 Play Local</Link>
                </Button>
              </Card>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
            >
              <Card hover padding="lg" className="h-full flex flex-col group">
                <motion.div
                  className="text-5xl mb-4"
                  whileHover={{ scale: 1.2, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  🌐
                </motion.div>
                <h2 className="font-heading text-2xl text-foreground mb-2 group-hover:text-cyan transition-colors">
                  Online Multiplayer
                </h2>
                <p className="text-sm text-muted mb-6 flex-1 leading-relaxed">
                  Create or join a room. Play with friends remotely. Everyone
                  uses their own device. Real-time sync.
                </p>
                <Button variant="secondary" size="lg" className="w-full border-cyan/30 hover:border-cyan/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]" asChild>
                  <Link href="/rooms">🔗 Play Online</Link>
                </Button>
              </Card>
            </motion.div>
          </div>

          <motion.div
            {...fadeUp}
            transition={{ delay: 0.6, type: "spring", stiffness: 120 }}
          >
            <Card padding="lg" className="max-w-2xl mx-auto">
              <h2 className="font-heading text-2xl text-foreground mb-6 text-center">
                ✨ How to Play
              </h2>
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                {[
                  {
                    emoji: "🎭",
                    title: "Get Roles",
                    desc: "Everyone gets the secret word except the impostor, who only knows the topic.",
                    color: "text-purple",
                  },
                  {
                    emoji: "💬",
                    title: "Give Clues",
                    desc: "Take turns saying a clue that proves you know the word — but don't make it too obvious!",
                    color: "text-cyan",
                  },
                  {
                    emoji: "🗳️",
                    title: "Vote",
                    desc: "Discuss and vote on who the impostor is. Catch them and the group wins!",
                    color: "text-orange",
                  },
                ].map((step, i) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.15 }}
                    className="group"
                  >
                    <motion.div
                      className="text-4xl mb-3"
                      whileHover={{ scale: 1.3 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {step.emoji}
                    </motion.div>
                    <h3 className={`font-heading text-lg ${step.color} mb-1`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {step.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {!loading && !user && (
            <motion.div
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <p className="text-muted mb-4">
                Create an account to track your stats and climb the leaderboard 🏆
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
