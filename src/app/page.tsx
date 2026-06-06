"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginWithNext, signupWithNext } from "@/lib/auth-path";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";

type LiveRoom = { id: string; code: string; max_players: number; status: string; room_players: { id: string }[] };

/* Sample rooms keep the marquee alive before the DB has live games. */
const SAMPLE_ROOMS = [
  { code: "VXQR", players: 6, max: 8, status: "playing" },
  { code: "MZ7K", players: 4, max: 6, status: "waiting" },
  { code: "BQ29", players: 8, max: 8, status: "playing" },
  { code: "TLP4", players: 3, max: 10, status: "waiting" },
  { code: "K8WD", players: 5, max: 6, status: "playing" },
  { code: "RJ6N", players: 7, max: 8, status: "waiting" },
];

const HOW_STEPS: { ic: IconName; n: string; t: string; d: string }[] = [
  { ic: "dice", n: "01", t: "Get your role", d: "The crew sees the secret word. The impostor sees only the topic — and has to fake it." },
  { ic: "chat", n: "02", t: "Drop a clue", d: "Take turns giving a one-word hint. Prove you know the word without handing it over." },
  { ic: "vote", n: "03", t: "Vote it out", d: "Read the table, argue, and vote. Catch the impostor and the crew wins the round." },
];

export default function HomePage() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);

  useEffect(() => {
    const supabase = createClient();
    async function fetchRooms() {
      const { data: open } = await supabase
        .from("rooms")
        .select("id, code, max_players, status, room_players(id)")
        .eq("is_private", false)
        .in("status", ["waiting", "playing"])
        .order("updated_at", { ascending: false })
        .limit(10);
      setLiveRooms((open ?? []) as LiveRoom[]);
    }
    void fetchRooms();
    const poll = setInterval(fetchRooms, 15000);
    return () => clearInterval(poll);
  }, []);

  const realRooms = liveRooms.map((r) => ({
    code: r.code,
    players: r.room_players.length,
    max: r.max_players,
    status: r.status,
  }));
  const marqueeRooms = realRooms.length >= 4 ? realRooms : [...realRooms, ...SAMPLE_ROOMS].slice(0, 6);
  const playingNow = realRooms.reduce((a, r) => a + r.players, 0);

  return (
    <>
      <Header
        user={
          user
            ? {
                username: getAuthDisplayName(user, profile),
                avatarColor: getAuthAvatarColor(user, profile),
              }
            : null
        }
      />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <Section className="relative pt-28 pb-10">
        {/* floating role markers */}
        <div className="float absolute left-1 top-64 z-[2] hidden opacity-90 lg:block">
          <RoleFloat role="impostor" label="The Impostor" sub="knows the topic only" />
        </div>
        <div
          className="float absolute right-1 top-80 z-[2] hidden opacity-90 lg:block"
          style={{ animationDelay: "1.2s" }}
        >
          <RoleFloat role="crew" label="The Crew" sub="knows the secret word" />
        </div>

        <div className="flex flex-col items-center gap-6 px-0 pt-10 pb-2 text-center">
          <div className="rise flex items-center justify-center gap-3">
            <span className="livedot" />
            <span className="kicker">Social deduction · played live</span>
          </div>

          <h1
            className="display rise"
            style={{ fontSize: "clamp(68px, 13vw, 168px)", color: "var(--text)", animationDelay: ".05s" }}
          >
            IMP<span style={{ color: "var(--brand)" }}>O</span>STER
          </h1>

          <p
            className="rise max-w-[540px] text-[18px] leading-relaxed text-muted"
            style={{ animationDelay: ".12s" }}
          >
            Everyone gets the secret word — except one faker, who only knows the topic. Trade clues,
            read the room, and drag the impostor into the light.
          </p>

          <div className="rise flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: ".18s" }}>
            <Button variant="heat" size="lg" asChild>
              <Link href="/rooms">
                <Icon name="globe" size={19} /> Play with strangers
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/local/setup">
                <Icon name="users" size={19} /> Play with friends
              </Link>
            </Button>
          </div>

          <div className="rise mt-1.5 flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: ".24s" }}>
            <Stat n={playingNow > 0 ? String(playingNow) : "New"} l="playing now" live />
            <Divider />
            <Stat n={realRooms.length > 0 ? String(realRooms.length) : "Open"} l="live rooms" />
            <Divider />
            <Stat n="3–10" l="players / room" />
          </div>
        </div>
      </Section>

      {/* ── MODE PORTALS ─────────────────────────────────────────────────────── */}
      <Section className="pt-8 pb-8">
        <div className="grid gap-[18px] sm:grid-cols-2">
          <ModePortal
            tone="brand" icon="users" no="01" title="With Friends" href="/local/setup"
            desc="Spin up a private game in one tap. Everyone gets the real word; the impostor only sees the topic. Pass one phone around the table."
            bullets={["Pass-and-play on one device", "You pick the topic pack", "3–10 players per round"]}
            cta="Start a room"
          />
          <ModePortal
            tone="heat" icon="globe" no="02" title="With Strangers" href="/rooms"
            desc="Drop into a live room with players worldwide. Type your clues, watch the table react in real time, and vote out the faker before they slip away."
            bullets={["Instant online rooms", "Live chat + clue board", "Climb the global ladder"]}
            cta="Find a match"
          />
        </div>
      </Section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <Section className="pt-16 pb-10 text-center">
        <p className="kicker mb-2.5">The loop</p>
        <h2 className="mb-9" style={{ fontSize: "clamp(28px,4vw,40px)" }}>Three minutes. One faker.</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW_STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="card card-pad text-left"
            >
              <div className="mb-[18px] flex items-center justify-between">
                <div
                  className="grid size-[46px] place-items-center rounded-[13px]"
                  style={{
                    background: "color-mix(in oklab, var(--brand) 14%, transparent)",
                    color: "var(--brand-2)",
                    border: "1px solid color-mix(in oklab, var(--brand) 30%, transparent)",
                  }}
                >
                  <Icon name={s.ic} size={22} />
                </div>
                <span className="display" style={{ fontSize: 40, color: "color-mix(in oklab, var(--text) 12%, transparent)" }}>
                  {s.n}
                </span>
              </div>
              <h3 className="mb-2 text-[19px]">{s.t}</h3>
              <p className="text-[14.5px] leading-relaxed text-muted">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── LIVE MARQUEE ─────────────────────────────────────────────────────── */}
      <Section className="pt-8 pb-10">
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="livedot" />
            <span className="kicker">Rooms open right now</span>
          </div>
          <Link
            href="/rooms"
            className="flex items-center gap-2 text-[13px] font-semibold text-muted transition-colors hover:text-foreground"
            style={{ fontFamily: "var(--font-head)" }}
          >
            Browse all <Icon name="arrow" size={15} />
          </Link>
        </div>
        <div
          className="marquee overflow-hidden"
          style={{ maskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)" }}
        >
          <div className="marquee-track">
            {[...marqueeRooms, ...marqueeRooms].map((r, i) => {
              const open = r.status === "waiting" || r.status === "open";
              return (
                <Link
                  key={i}
                  href="/rooms"
                  className="card min-w-[230px] px-[18px] py-3.5 text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="display text-[26px] tracking-[.14em]" style={{ color: "var(--brand-2)" }}>
                        {r.code}
                      </div>
                      <div className="mt-0.5 text-[12.5px] text-muted">{r.players}/{r.max} players</div>
                    </div>
                    <Chip tone={open ? "live" : "aqua"}>{open ? "Open" : "In round"}</Chip>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── PREMIUM TEASER ───────────────────────────────────────────────────── */}
      <Section className="pt-8 pb-[70px]">
        <div className="card card-pad glow-ring relative overflow-hidden">
          <div className="relative z-[1] flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-[560px]">
              <Chip tone="brand" icon="crown" className="mb-3.5">Imposter+</Chip>
              <h2 className="mb-2.5" style={{ fontSize: "clamp(24px,3.4vw,34px)" }}>Run out of words? Never.</h2>
              <p className="text-[15.5px] leading-relaxed text-muted">
                Unlock 40+ premium topic packs, priority rooms, and a glowing profile badge — for the
                price of one coffee a month.
              </p>
            </div>
            <div className="flex min-w-[200px] flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <span className="display text-[56px]" style={{ color: "var(--text)" }}>$3</span>
                <span className="text-[16px] text-muted">/ month</span>
              </div>
              <Button variant="primary" size="lg" asChild>
                <Link href="/pricing">See what&apos;s inside <Icon name="arrow" size={18} /></Link>
              </Button>
            </div>
          </div>
          <div className="shimmer absolute inset-0 opacity-50" />
        </div>
      </Section>

      {/* ── AUTH CTA (signed out) ─────────────────────────────────────────────── */}
      {!user && (
        <Section className="border-t pb-[70px] pt-12" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto max-w-sm text-center">
            <h2 className="mb-3" style={{ fontSize: "clamp(22px,3.5vw,30px)" }}>Track your progress</h2>
            <p className="mb-8 text-[14.5px] leading-relaxed text-muted">
              Create an account to save stats, climb the leaderboard, and unlock premium topic packs.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" size="md" asChild>
                <Link href={loginWithNext(pathname)}>Sign in</Link>
              </Button>
              <Button variant="primary" size="md" asChild>
                <Link href={signupWithNext(pathname)}>Create account</Link>
              </Button>
            </div>
          </div>
        </Section>
      )}

      <Footer />
    </>
  );
}

/* ── Local building blocks ──────────────────────────────────────────────────── */

function Section({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`mx-auto max-w-[1180px] px-5 ${className}`} style={style}>
      {children}
    </section>
  );
}

function RoleFloat({ role, label, sub }: { role: "impostor" | "crew"; label: string; sub: string }) {
  const c = role === "impostor" ? "var(--heat)" : "var(--aqua)";
  return (
    <div className="card flex items-center gap-2.5 px-3.5 py-2.5">
      <div
        className="grid size-[38px] place-items-center rounded-[11px] text-white"
        style={{ background: `linear-gradient(150deg, ${c}, color-mix(in oklab, ${c} 55%, #000))` }}
      >
        <Icon name={role === "impostor" ? "mask" : "shield"} size={20} />
      </div>
      <div>
        <div className="text-[13.5px] font-bold" style={{ fontFamily: "var(--font-head)" }}>{label}</div>
        <div className="text-[11.5px] text-muted">{sub}</div>
      </div>
    </div>
  );
}

function Stat({ n, l, live }: { n: string; l: string; live?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {live && <span className="livedot" />}
      <span className="display text-[22px]" style={{ color: "var(--text)" }}>{n}</span>
      <span className="text-[13px] text-muted">{l}</span>
    </div>
  );
}

function Divider() {
  return <span className="h-4 w-px" style={{ background: "var(--border-2)" }} />;
}

function ModePortal({
  tone,
  icon,
  no,
  title,
  desc,
  bullets,
  cta,
  href,
}: {
  tone: "brand" | "heat";
  icon: IconName;
  no: string;
  title: string;
  desc: string;
  bullets: string[];
  cta: string;
  href: string;
}) {
  const c = tone === "heat" ? "var(--heat)" : "var(--brand)";
  return (
    <Link href={href} className="mode-card rise block" style={{ ["--c" as string]: c }}>
      <span className="display mode-no" style={{ color: `color-mix(in oklab, ${c} 14%, transparent)` }}>{no}</span>
      <div
        className="mode-ic"
        style={{
          background: `color-mix(in oklab, ${c} 16%, transparent)`,
          color: c,
          border: `1px solid color-mix(in oklab, ${c} 35%, transparent)`,
        }}
      >
        <Icon name={icon} size={26} />
      </div>
      <h3 className="mb-2.5 text-[27px]">{title}</h3>
      <p className="mb-[18px] text-[15px] leading-relaxed text-muted">{desc}</p>
      <div className="mb-[22px] flex flex-col gap-2">
        {bullets.map((b) => (
          <div key={b} className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--text)" }}>
            <Icon name="check" size={15} stroke={2.4} style={{ color: c }} /> {b}
          </div>
        ))}
      </div>
      <span className="mode-cta flex items-center gap-2 text-[15px] font-bold" style={{ color: c, fontFamily: "var(--font-head)" }}>
        {cta} <Icon name="arrow" size={18} />
      </span>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="mt-5 border-t" style={{ borderColor: "var(--border)" }}>
      <Section className="py-[30px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Logo size={26} />
          <div
            className="flex flex-wrap gap-4 text-[13px] font-medium text-muted"
            style={{ fontFamily: "var(--font-head)" }}
          >
            <Link href="/local/setup" className="transition-colors hover:text-foreground">Friends</Link>
            <Link href="/rooms" className="transition-colors hover:text-foreground">Online</Link>
            <Link href="/leaderboard" className="transition-colors hover:text-foreground">Leaderboard</Link>
            <Link href="/pricing" className="transition-colors hover:text-foreground">Premium</Link>
          </div>
          <span className="text-[12.5px] text-muted">© 2026 Imposter</span>
        </div>
      </Section>
    </footer>
  );
}
