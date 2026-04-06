"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { ImpostorFull, InnocentFull } from "@/components/ui/Characters";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const TITLE = "IMPOSTOR";


const steps = [
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
    desc: "Discuss and vote. Catch the impostor and the group wins — or let them slip away.",
  },
];

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.7], [0, -50]);

  return (
    <>
      <Header
        user={
          profile
            ? { username: profile.username, avatarColor: profile.avatar_color }
            : null
        }
      />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      >
        {/* Radial purple glow at top */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 75% 55% at 50% -5%, rgba(128,112,212,0.16) 0%, transparent 65%)",
          }}
        />

        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(128,112,212,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(128,112,212,0.06) 1px, transparent 1px)",
            backgroundSize: "88px 88px",
          }}
        />

        {/* Vignette over grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(8,9,26,0.85) 100%)",
          }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-4"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          {/* Label */}
          <motion.p
            className="mb-8 text-[10px] uppercase tracking-[0.55em] text-muted font-medium"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Social Deduction Game
          </motion.p>

          {/* Main title — letter-by-letter */}
          <h1
            className="mb-8 leading-none select-none"
            style={{ perspective: "800px" }}
          >
            {TITLE.split("").map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 80, rotateX: -40 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  delay: 0.3 + i * 0.055,
                  duration: 0.75,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
                className="inline-block cursor-default"
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "clamp(72px, 17vw, 148px)",
                  letterSpacing: "0.08em",
                  color: "var(--foreground)",
                  display: "inline-block",
                }}
                whileHover={{
                  color: "var(--purple-glow)",
                  y: -6,
                  transition: { duration: 0.2 },
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>

          {/* Animated divider line */}
          <motion.div
            className="mb-8 h-px origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.0, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "260px",
              background:
                "linear-gradient(to right, transparent, rgba(128,112,212,0.5), transparent)",
            }}
          />

          {/* Tagline */}
          <motion.p
            className="mb-12 max-w-[340px] text-[15px] leading-relaxed text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.7 }}
          >
            One player doesn&apos;t know the secret word.
            <br />
            Find them before they blend in.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button variant="primary" size="lg" asChild>
              <Link href="/local/setup">Play Local</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/rooms">Play Online</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.6 }}
        >
          <span
            className="text-[9px] uppercase tracking-[0.4em]"
            style={{ color: "rgba(88,96,126,0.5)" }}
          >
            Scroll
          </span>
          <div className="relative h-10 w-px overflow-hidden">
            <motion.div
              className="absolute inset-0 w-full"
              style={{
                background: "linear-gradient(to bottom, transparent, rgba(88,96,126,0.4), transparent)",
              }}
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </section>

      {/* ── CHARACTERS ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(28,31,58,0.9) 20%, rgba(28,31,58,0.9) 80%, transparent)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 50% 70% at 18% 55%, rgba(128,112,212,0.07) 0%, transparent 65%), radial-gradient(ellipse 50% 70% at 82% 55%, rgba(77,148,184,0.07) 0%, transparent 65%)",
          }}
        />

        <div className="mx-auto max-w-4xl relative z-10">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.5em] text-muted/60">The tension</p>
            <h2 className="font-heading text-[clamp(26px,4vw,38px)] text-foreground">
              Can you tell them apart?
            </h2>
            <p className="mt-3 text-sm text-muted max-w-xs mx-auto leading-relaxed">
              One player is hiding in plain sight. Every clue counts.
            </p>
          </motion.div>

          <div className="flex items-end justify-between gap-4 sm:gap-8">
            {/* Impostor */}
            <motion.div
              className="flex flex-1 flex-col items-center"
              initial={{ x: -70, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={{ y: [0, -11, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ImpostorFull />
              </motion.div>
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <p className="text-[10px] uppercase tracking-[0.35em] text-purple/60 mb-1">The Impostor</p>
                <p className="text-[11px] text-muted italic">&ldquo;Shh&hellip; they&apos;ll never know.&rdquo;</p>
              </motion.div>
            </motion.div>

            {/* VS */}
            <motion.div
              className="shrink-0 pb-14 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  color: "rgba(88,96,126,0.2)",
                  letterSpacing: "0.08em",
                }}
              >
                VS
              </span>
            </motion.div>

            {/* Innocent */}
            <motion.div
              className="flex flex-1 flex-col items-center"
              initial={{ x: 70, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              >
                <InnocentFull />
              </motion.div>
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <p className="text-[10px] uppercase tracking-[0.35em] text-cyan/60 mb-1">The Innocent</p>
                <p className="text-[11px] text-muted italic">&ldquo;I swear I know the word!&rdquo;</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MODES ────────────────────────────────────────────────────────────── */}
      <section className="relative px-4 py-28 sm:py-36">
        {/* Top separator */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(28,31,58,0.9) 20%, rgba(28,31,58,0.9) 80%, transparent)",
          }}
        />

        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.5em] text-muted/60">
              Choose your mode
            </p>
            <h2
              className="font-heading text-[clamp(28px,4vw,38px)] text-foreground"
            >
              How do you want to play?
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
            {/* Local */}
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href="/local/setup"
                className="group relative block overflow-hidden rounded-2xl p-8 transition-all duration-500"
                style={{
                  background: "rgba(14,16,36,0.7)",
                  border: "1px solid rgba(28,31,58,1)",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(128,112,212,0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 24px 64px rgba(0,0,0,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(28,31,58,1)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Background step number */}
                <span
                  className="absolute -right-3 -top-5 leading-none select-none transition-all duration-500 group-hover:opacity-100"
                  style={{
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: "9rem",
                    color: "rgba(128,112,212,0.055)",
                    opacity: 1,
                  }}
                >
                  01
                </span>

                <div className="relative">
                  {/* Icon */}
                  <div
                    className="mb-7 flex size-12 items-center justify-center rounded-xl transition-all duration-300"
                    style={{
                      background: "rgba(128,112,212,0.1)",
                      border: "1px solid rgba(128,112,212,0.2)",
                    }}
                  >
                    <svg
                      className="size-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="rgba(128,112,212,0.9)"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h.008v.008H10.5v-.008z"
                      />
                    </svg>
                  </div>

                  <h3 className="font-heading mb-3 text-2xl text-foreground">
                    Local Party
                  </h3>
                  <p className="mb-9 text-sm leading-relaxed text-muted">
                    Pass one device around the table. Perfect for game night.
                    Supports 3–10 players.
                  </p>

                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--purple)" }}>
                    <span>Start playing</span>
                    <motion.svg
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      whileHover={{ x: 4 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </motion.svg>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Online */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href="/rooms"
                className="group relative block overflow-hidden rounded-2xl p-8 transition-all duration-500"
                style={{
                  background: "rgba(14,16,36,0.7)",
                  border: "1px solid rgba(28,31,58,1)",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(77,148,184,0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 24px 64px rgba(0,0,0,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(28,31,58,1)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Background step number */}
                <span
                  className="absolute -right-3 -top-5 leading-none select-none"
                  style={{
                    fontFamily: "var(--font-bebas), sans-serif",
                    fontSize: "9rem",
                    color: "rgba(77,148,184,0.055)",
                  }}
                >
                  02
                </span>

                <div className="relative">
                  {/* Icon */}
                  <div
                    className="mb-7 flex size-12 items-center justify-center rounded-xl transition-all duration-300"
                    style={{
                      background: "rgba(77,148,184,0.1)",
                      border: "1px solid rgba(77,148,184,0.2)",
                    }}
                  >
                    <svg
                      className="size-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="rgba(77,148,184,0.9)"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.038 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.038-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                      />
                    </svg>
                  </div>

                  <h3 className="font-heading mb-3 text-2xl text-foreground">
                    Online Multiplayer
                  </h3>
                  <p className="mb-9 text-sm leading-relaxed text-muted">
                    Create or join a room. Everyone uses their own device with
                    real-time sync.
                  </p>

                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--cyan)" }}>
                    <span>Browse rooms</span>
                    <svg
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="relative px-4 py-28 sm:py-36">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(28,31,58,0.9) 20%, rgba(28,31,58,0.9) 80%, transparent)",
          }}
        />

        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.5em] text-muted/60">
              The process
            </p>
            <h2 className="font-heading text-[clamp(28px,4vw,38px)] text-foreground">
              How it works
            </h2>
          </motion.div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  delay: i * 0.14,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative"
              >
                {/* Connecting line (desktop, between steps) */}
                {i < steps.length - 1 && (
                  <div
                    className="absolute hidden sm:block top-7 left-full w-full h-px -translate-x-1/2"
                    style={{
                      background:
                        "linear-gradient(to right, rgba(28,31,58,0.8), rgba(28,31,58,0.2))",
                      width: "calc(100% - 32px)",
                      left: "calc(50% + 16px)",
                    }}
                  />
                )}

                <div className="flex items-start gap-5 sm:flex-col sm:gap-0">
                  {/* Step badge */}
                  <div
                    className="shrink-0 flex size-14 items-center justify-center rounded-xl sm:mb-6"
                    style={{
                      background: "rgba(14,16,36,0.8)",
                      border: "1px solid rgba(28,31,58,1)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-bebas), sans-serif",
                        fontSize: "1.35rem",
                        color: "rgba(128,112,212,0.65)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {s.step}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-heading mb-2 text-[17px] text-foreground sm:mb-2">
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTH CTA ─────────────────────────────────────────────────────────── */}
      {!loading && !user && (
        <motion.section
          className="relative px-4 py-24 sm:py-32"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(28,31,58,0.9) 20%, rgba(28,31,58,0.9) 80%, transparent)",
            }}
          />

          <div className="mx-auto max-w-sm text-center">
            <h2 className="font-heading mb-3 text-[clamp(22px,3.5vw,30px)] text-foreground">
              Track your progress
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-muted">
              Create an account to save stats, climb the leaderboard, and unlock premium word categories.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" size="md" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="primary" size="md" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </motion.section>
      )}
    </>
  );
}
