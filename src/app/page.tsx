"use client";

import { AppShell, RoomCard } from "@/components/game";
import { Button } from "@/components/ui/Button";
import { CardFan, type FanCard } from "@/components/ui/CardFan";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
import { loginWithNext, signupWithNext } from "@/lib/auth-path";
import { getActiveRoomCutoffIso } from "@/lib/rooms/stale";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type LiveRoom = {
  id: string;
  code: string;
  max_players: number;
  status: string;
  phase: string;
  updated_at: string;
  settings: unknown;
  room_players: { id: string }[];
};

function getRoomTopic(settings: unknown): string {
  if (settings && typeof settings === "object" && "category" in settings) {
    const category = (settings as { category?: unknown }).category;
    if (typeof category === "string" && category.trim()) return category;
  }
  return "Random pack";
}

async function refreshSeededRooms() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);
  try {
    await fetch("/api/rooms/ai/ensure", {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    console.warn("ensure rooms:", error);
  } finally {
    clearTimeout(timeout);
  }
}

export default function HomePage() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);

  const fetchRooms = useCallback(async () => {
    const supabase = createClient();
    const runQuery = async () => {
      const { data: open } = await supabase
        .from("rooms")
        .select("id, code, max_players, status, phase, updated_at, settings, room_players(id)")
        .eq("is_private", false)
        .in("status", ["waiting", "playing"])
        .neq("phase", "results")
        .gte("updated_at", getActiveRoomCutoffIso())
        .order("updated_at", { ascending: false })
        .limit(6);
      setLiveRooms((open ?? []) as LiveRoom[]);
      return (open ?? []).length;
    };

    // Show whatever's there now, then seed the bot tables in the background and
    // re-query — don't block the section on the ensure call.
    const count = await runQuery();
    if (count === 0) {
      void refreshSeededRooms().then(runQuery);
    } else {
      void refreshSeededRooms();
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    function scheduleRefresh() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void fetchRooms();
      }, 350);
    }

    scheduleRefresh();
    const channel = supabase
      .channel("home-public-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, scheduleRefresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR") scheduleRefresh();
      });
    const poll = setInterval(() => void fetchRooms(), 15000);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  const userSlot = user
    ? {
        username: getAuthDisplayName(user, profile),
        avatarColor: getAuthAvatarColor(user, profile),
      }
    : null;

  const rooms = liveRooms.map((room) => ({
    code: room.code,
    players: room.room_players.length,
    max: room.max_players,
    status: room.status,
    topic: getRoomTopic(room.settings),
  }));
  const playingNow = rooms.reduce((sum, room) => sum + room.players, 0);

  return (
    <AppShell user={userSlot} mainClassName="max-w-6xl">
      <Hero playingNow={playingNow} openRooms={rooms.length} />
      <VaultFeature />
      <LiveTables rooms={rooms} playingNow={playingNow} />
      <PackGrid />
      <HowItWorks />
      <ClosingBand signedOut={!user} pathname={pathname} />
      <Footer />
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — centered headline, one CTA, a fanned hand of topic packs.    */
/* ------------------------------------------------------------------ */

function Hero({ playingNow, openRooms }: { playingNow: number; openRooms: number }) {
  return (
    <section className="pb-8 pt-2 text-center sm:pb-12">
      <h1 className="display mx-auto text-[clamp(2.25rem,7vw,3.75rem)] leading-[1.06]">
        <span className="block sm:whitespace-nowrap">Everyone knows the word.</span>
        <span className="block text-brand sm:whitespace-nowrap">One of you is lying.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted sm:text-lg">
        Open a topic pack, trade quiet one-word clues, and unmask the player faking
        it from the category alone. One phone or online, three to ten friends.
      </p>

      <div className="mt-9 flex flex-col items-center gap-4">
        <Button size="lg" className="w-full rounded-full px-9 sm:w-auto" asChild>
          <Link href="/local/setup">
            Start a game <Icon name="arrow" size={19} />
          </Link>
        </Button>
        <Link
          href="/rooms"
          className="text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          or join an online room
        </Link>
      </div>

      <p className="mt-7 flex items-center justify-center gap-2 text-[13px] font-semibold text-muted-2">
        <span className="inline-block size-2 rounded-full bg-brand" aria-hidden />
        {playingNow} playing now
        <span aria-hidden>·</span>
        {openRooms} open {openRooms === 1 ? "room" : "rooms"}
      </p>

      <CardFan cards={HERO_FAN} className="mt-8 w-full max-w-6xl" />
    </section>
  );
}

// One round, dealt out: everyone gets the same category and word — except the
// card in front, who only gets the category and a faint hint.
const ROUND_CATEGORY = "Movies";
const ROUND_WORD = "TITANIC";
const ROUND_HINT = "romance";
const HERO_FAN: FanCard[] = [
  { id: "seat-1", category: ROUND_CATEGORY, word: ROUND_WORD },
  { id: "seat-2", category: ROUND_CATEGORY, word: ROUND_WORD },
  { id: "seat-3", category: ROUND_CATEGORY, word: ROUND_WORD },
  { id: "impostor", category: ROUND_CATEGORY, impostor: true, hint: ROUND_HINT },
  { id: "seat-4", category: ROUND_CATEGORY, word: ROUND_WORD },
  { id: "seat-5", category: ROUND_CATEGORY, word: ROUND_WORD },
  { id: "seat-6", category: ROUND_CATEGORY, word: ROUND_WORD },
];

/* ------------------------------------------------------------------ */
/* Topic Vault — the editorial feature block.                          */
/* ------------------------------------------------------------------ */

function VaultFeature() {
  return (
    <section className="border-t border-border py-14 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">
        The Topic Vault
      </p>
      <h2 className="display mt-3 max-w-[18ch] text-[clamp(1.9rem,4.5vw,3rem)]">
        Any table. Any topic.
      </h2>

      <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="overflow-hidden rounded-[26px] bg-black">
          <Image
            src="/assets/topic-vault-cards.png"
            alt="A spread of Impostor topic packs — Cult Movies, Street Food, 90s Nostalgia, World Capitals, K-Pop and more"
            width={1448}
            height={1086}
            priority
            sizes="(min-width: 1024px) 55vw, 92vw"
            className="h-auto w-full"
          />
        </div>

        <div>
          <p className="max-w-[46ch] text-[17px] leading-relaxed text-muted">
            Forty-plus hand-built packs — cult movies, street food, boss battles,
            world capitals. The crew sees the secret word. The impostor only gets
            the pack name and has to bluff every clue from there.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <span className="display text-[3.25rem] leading-none text-brand">40+</span>
            <span className="text-[15px] font-semibold leading-snug text-muted">
              packs in the vault,
              <br />
              new words every season
            </span>
          </div>

          <div className="mt-8">
            <Button variant="secondary" className="rounded-full px-7" asChild>
              <Link href="/local/setup">
                Browse the vault <Icon name="arrow" size={17} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Live tables — real open rooms.                                      */
/* ------------------------------------------------------------------ */

type RoomView = {
  code: string;
  players: number;
  max: number;
  status: string;
  topic: string;
};

function LiveTables({ rooms, playingNow }: { rooms: RoomView[]; playingNow: number }) {
  return (
    <section className="border-t border-border py-14 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display text-[clamp(1.9rem,4.5vw,3rem)]">Live tables</h2>
          <p className="mt-2 text-[15px] text-muted">
            {rooms.length > 0
              ? `${playingNow} players across ${rooms.length} open ${rooms.length === 1 ? "room" : "rooms"} right now`
              : "No open tables this second — be the one who starts it"}
          </p>
        </div>
        <Link
          href="/rooms"
          className="flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          Browse rooms <Icon name="arrow" size={16} />
        </Link>
      </div>

      <div className="mt-8">
        {rooms.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {rooms.slice(0, 3).map((room) => (
              <RoomCard
                key={room.code}
                code={room.code}
                players={room.players}
                maxPlayers={room.max}
                status={room.status === "playing" ? "live" : "open"}
                topic={room.topic}
                action={
                  <Button
                    size="sm"
                    variant={room.status === "playing" ? "secondary" : "primary"}
                    asChild
                  >
                    <Link href="/rooms">
                      {room.status === "playing" ? "Watch" : "Join"}
                    </Link>
                  </Button>
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-5 rounded-[26px] bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold">Open the first table</h3>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">
                Spin up a room, share the four-letter code, and your friends drop
                straight in.
              </p>
            </div>
            <Button className="rounded-full px-7" asChild>
              <Link href="/rooms">
                Create a room <Icon name="arrow" size={17} />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Topic packs — the category grid.                                    */
/* ------------------------------------------------------------------ */

const PACKS: { name: string; blurb: string; icon: IconName; tone: string }[] = [
  { name: "Movies", blurb: "Blockbusters, cult classics, one-liners", icon: "play", tone: "bg-heat text-heat-ink" },
  { name: "Food", blurb: "Street food, sweets, things on a stick", icon: "flame", tone: "bg-brand text-brand-ink" },
  { name: "Music", blurb: "K-pop, one-hit wonders, festival sets", icon: "bolt", tone: "bg-cream text-ink" },
  { name: "Places", blurb: "Capitals, landmarks, tiny hometowns", icon: "globe", tone: "bg-surface-2 text-foreground" },
];

function PackGrid() {
  return (
    <section className="border-t border-border py-14 sm:py-20">
      <h2 className="display text-[clamp(1.9rem,4.5vw,3rem)]">Topic packs</h2>
      <p className="mt-2 max-w-[52ch] text-[15px] text-muted">
        Pick a pack and the whole table bluffs over its words. Leave it on Random
        to let the vault choose.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PACKS.map((pack) => (
          <Link
            key={pack.name}
            href="/local/setup"
            className="group flex h-full flex-col justify-between rounded-[22px] bg-card p-6 transition-all duration-200 will-change-transform hover:-translate-y-0.5 hover:bg-card-hover active:translate-y-0 active:scale-[0.99]"
          >
            <div>
              <div className={cn("grid size-12 place-items-center rounded-2xl", pack.tone)}>
                <Icon name={pack.icon} size={22} />
              </div>
              <h3 className="mt-5 text-xl font-bold">{pack.name}</h3>
              <p className="mt-1.5 text-[14px] leading-snug text-muted">{pack.blurb}</p>
            </div>
            <span className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-brand transition-[gap] group-hover:gap-2.5">
              Open pack <Icon name="arrow" size={15} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How a round works.                                                  */
/* ------------------------------------------------------------------ */

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "eye", title: "Reveal", text: "Everyone gets the secret word — except the impostor, who only sees the pack." },
  { icon: "chat", title: "Clue", text: "Go around the table. One word each about the secret word. Say too much and you're a target." },
  { icon: "vote", title: "Vote", text: "Point at the faker. Catch them and the crew wins. Miss and the impostor walks." },
];

function HowItWorks() {
  return (
    <section className="border-t border-border py-14 sm:py-20">
      <h2 className="display text-[clamp(1.9rem,4.5vw,3rem)]">How a round works</h2>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={step.title} className="rounded-[22px] bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-brand">
                <Icon name={step.icon} size={18} />
              </span>
              <span className="display text-lg text-muted">0{index + 1}</span>
            </div>
            <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing band.                                                       */
/* ------------------------------------------------------------------ */

function ClosingBand({ signedOut, pathname }: { signedOut: boolean; pathname: string }) {
  return (
    <section className="py-16 sm:py-20">
      <div className="rounded-[28px] bg-card px-6 py-14 text-center sm:px-10">
        <h2 className="display mx-auto text-[clamp(2rem,5vw,3.25rem)] leading-[1.06]">
          <span className="block sm:whitespace-nowrap">Grab your friends.</span>
          <span className="block sm:whitespace-nowrap">Start bluffing.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[40ch] text-[15px] leading-relaxed text-muted">
          Free to play, no download. Premium unlocks the full vault and saved
          stats from $3 a month.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="w-full rounded-full px-9 sm:w-auto" asChild>
            <Link href="/local/setup">
              Start a game <Icon name="arrow" size={19} />
            </Link>
          </Button>
          {signedOut ? (
            <Button
              size="lg"
              variant="secondary"
              className="w-full rounded-full px-9 sm:w-auto"
              asChild
            >
              <Link href={signupWithNext(pathname)}>Create a free account</Link>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              className="w-full rounded-full px-9 sm:w-auto"
              asChild
            >
              <Link href="/pricing">See Impostor+</Link>
            </Button>
          )}
        </div>
        {signedOut && (
          <p className="mt-5 text-[13px] text-muted-2">
            Already have one?{" "}
            <Link
              href={loginWithNext(pathname)}
              className="font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Logo size={26} />
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-muted">
          <Link href="/local/setup" className="transition-colors hover:text-foreground">
            Play local
          </Link>
          <Link href="/rooms" className="transition-colors hover:text-foreground">
            Online rooms
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-foreground">
            Leaderboard
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">
            Premium
          </Link>
        </div>
        <span className="text-xs text-muted-2">© 2026 Impostor</span>
      </div>
    </footer>
  );
}
