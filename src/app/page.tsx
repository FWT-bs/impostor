"use client";

import {
  AppShell,
  DoodleMark,
  PageHeader,
  RoomCard,
} from "@/components/game";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
import { loginWithNext, signupWithNext } from "@/lib/auth-path";
import { getActiveRoomCutoffIso } from "@/lib/rooms/stale";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";

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
  const timeout = setTimeout(() => controller.abort(), 4500);
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
    await refreshSeededRooms();

    const supabase = createClient();
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
    <AppShell user={userSlot} mainClassName="max-w-7xl">
      <section className="relative grid items-center gap-8 py-6 sm:gap-10 sm:py-10 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
        <DoodleMark kind="shh" className="left-1 top-20 sm:-left-5" color="var(--heat)" size={38} />
        <DoodleMark kind="eye" className="left-[42%] top-14 hidden lg:block" color="var(--text)" size={48} />
        <DoodleMark kind="mask" className="left-[32%] top-[52%] hidden lg:block" color="var(--heat)" size={50} rotate={8} />
        <div className="relative z-[1]">
          <PageHeader
            title={
              <>
                Spot the <span className="scribble-word" style={{ "--scribble-color": "var(--heat)" } as CSSProperties}>lie</span>
                <br />
                Keep the word <span className="scribble-word" style={{ "--scribble-color": "var(--aqua)" } as CSSProperties}>safe</span>
              </>
            }
            description={
              <>
                Secret word, quiet clues, one player bluffing from the topic alone
              </>
            }
            actions={
              <>
                <Button size="lg" className="w-full sm:min-w-[240px] sm:w-auto" asChild>
                  <Link href="/local/setup"><Icon name="users" size={21} /> Start local game</Link>
                </Button>
                <Button variant="secondary" size="lg" className="w-full sm:min-w-[230px] sm:w-auto" asChild>
                  <Link href="/rooms"><Icon name="globe" size={21} /> Join online room</Link>
                </Button>
              </>
            }
          />

          <div className="grid max-w-2xl grid-cols-3 gap-3 sm:gap-5">
            <GameStat icon="users" value={String(playingNow)} label="players live" />
            <GameStat icon="trophy" value={String(rooms.length)} label="rooms open" />
            <GameStat icon="chair" value="3-10" label="seats per game" />
          </div>
        </div>

        <HeroTabletopImage />
      </section>

      <section className="py-7 sm:py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Game modes</h2>
          </div>
          <Link href="/rooms" className="hidden items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground sm:flex">
            Browse rooms <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <ModeLink
            href="/local/setup"
            title="Pass and play"
            imageSrc="/assets/round-preview-panel.png"
            imageAlt="Pass and play preview with a hidden impostor seat"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <ModeLink
              href="/rooms"
              title="Private room"
              imageSrc="/assets/online-room-board.png"
              imageAlt="Private room card with join code and ready seats"
            />
            <ModeLink
              href="/rooms"
              title="Public match"
              imageSrc="/assets/imposter-circle-hero.png"
              imageAlt="Public match with one impostor hidden among the table"
            />
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Open tables</h2>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/rooms">See all rooms</Link>
          </Button>
        </div>
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
                  <Button size="sm" variant={room.status === "playing" ? "secondary" : "primary"} asChild>
                    <Link href="/rooms">{room.status === "playing" ? "Watch code" : "Join"}</Link>
                  </Button>
                }
              />
            ))}
        </div>
      </section>

      {!user && (
        <section className="border-t border-border py-10 text-center">
          <h2 className="text-2xl font-bold">Save your table reads</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Wins, display name, premium packs, all kept together
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" asChild>
              <Link href={loginWithNext(pathname)}>Sign in</Link>
            </Button>
            <Button asChild>
              <Link href={signupWithNext(pathname)}>Create account</Link>
            </Button>
          </div>
        </section>
      )}

      <section className="pb-12 pt-8">
        <div className="relative overflow-hidden rounded-2xl border border-brand/55 bg-[radial-gradient(circle_at_12%_15%,rgba(255,55,48,0.26),transparent_34%),radial-gradient(circle_at_88%_85%,rgba(47,213,111,0.32),transparent_38%),#050705] p-6 shadow-[0_0_60px_rgba(47,213,111,0.18)] sm:p-8">
          <div className="absolute inset-x-8 top-0 h-1 rounded-full bg-brand" />
          <div className="relative z-[1] flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 grid size-12 place-items-center rounded-lg border border-heat/45 bg-heat/14 text-heat-2">
                <Icon name="crown" size={24} />
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">Unlock the full table</h2>
              <p className="mt-3 max-w-[62ch] text-muted">
                More packs, room priority, match history, a badge for regulars
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:min-w-[250px]">
              <div className="flex items-end gap-2">
                <span className="display text-5xl text-white">$3</span>
                <span className="pb-2 text-muted">/ month</span>
              </div>
              <Button className="bg-brand text-black hover:bg-brand-2" asChild>
                <Link href="/pricing">Unlock packs <Icon name="arrow" size={17} /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </AppShell>
  );
}

function GameStat({ icon, value, label }: { icon: "users" | "trophy" | "chair"; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} size={29} className={icon === "trophy" ? "text-heat" : "text-brand"} />
      <div>
        <p className="font-display text-2xl leading-none text-foreground sm:text-3xl">{value}</p>
        <p className="text-xs font-extrabold leading-4 text-muted sm:text-sm">{label}</p>
      </div>
    </div>
  );
}

function HeroTabletopImage() {
  return (
    <aside className="relative mx-auto w-full max-w-[690px] justify-self-center lg:justify-self-end">
      <div className="art-frame hero-image-frame">
        <Image
          src="/assets/tabletop-hero-board.png"
          alt="Crew and impostor figures holding word and hint cards on a black background"
          width={1448}
          height={1086}
          priority
          sizes="(min-width: 1024px) 52vw, 92vw"
          className="reference-art hero-image"
        />
      </div>
    </aside>
  );
}

function ModeLink({
  href,
  title,
  imageSrc,
  imageAlt,
}: {
  href: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-border bg-card/80 p-4 shadow-[0_12px_26px_rgba(7,22,42,0.07)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/42 hover:bg-card-hover hover:shadow-[0_16px_34px_rgba(24,185,100,0.12)] sm:p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold sm:text-xl">{title}</h3>
        <Icon name="arrow" size={18} className="shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand" />
      </div>
      <div className="mt-4 overflow-hidden rounded-xl bg-black/60">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1600}
          height={1200}
          sizes="(min-width: 1024px) 32vw, 92vw"
          className="h-40 w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02] sm:h-44"
        />
      </div>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="mt-6 border-t border-border py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Logo size={26} />
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-muted">
          <Link href="/local/setup" className="transition-colors hover:text-foreground">Play local</Link>
          <Link href="/rooms" className="transition-colors hover:text-foreground">Online rooms</Link>
          <Link href="/leaderboard" className="transition-colors hover:text-foreground">Leaderboard</Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">Premium</Link>
        </div>
        <span className="text-xs text-muted">© 2026 Imposter</span>
      </div>
    </footer>
  );
}
