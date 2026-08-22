"use client";

import {
  AppShell,
  RoomCard,
} from "@/components/game";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAuthAvatarColor, getAuthAvatarUrl, getAuthDisplayName } from "@/lib/auth-display-name";
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
        avatarUrl: getAuthAvatarUrl(user, profile),
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
      <section className="grid items-center gap-6 py-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
        <div className="rounded-[36px] bg-card p-8 sm:p-10">
          <h1 className="display text-[42px] leading-[1.02] sm:text-[56px] lg:text-[64px]">
            Spot the lie.
            <br />
            Keep the word <span className="text-brand">safe.</span>
          </h1>
          <p className="mt-4 max-w-[420px] text-[17px] leading-relaxed text-muted sm:text-lg">
            Secret word, quiet clues, one player bluffing from the topic alone.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/local/setup"><Icon name="users" size={20} /> Start local game</Link>
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/rooms"><Icon name="globe" size={20} /> Join online room</Link>
            </Button>
          </div>

          <div className="mt-10 flex max-w-md items-center gap-6">
            <GameStat value={String(playingNow)} label="players live" />
            <GameStat value={String(rooms.length)} label="rooms open" />
            <GameStat value="3-10" label="seats per game" />
          </div>
        </div>

        <HeroTabletopImage />
      </section>

      <section className="py-8 sm:py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold sm:text-[26px]">Game modes</h2>
          <Link href="/rooms" className="hidden items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground sm:flex">
            Browse rooms <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ModeTile
            href="/local/setup"
            title="Pass and play"
            description="One phone, three to ten people"
            icon="users"
            tone="brand"
          />
          <ModeTile
            href="/rooms"
            title="Private room"
            description="Share a four letter code"
            icon="lock"
            tone="cream"
          />
          <ModeTile
            href="/rooms"
            title="Public match"
            description="Drop into an open table"
            icon="globe"
            tone="heat"
          />
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
        <section className="rounded-[36px] bg-card px-6 py-10 text-center sm:px-8">
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
        <div className="rounded-[36px] bg-card p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand text-brand-ink">
                <Icon name="crown" size={24} />
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">Unlock the full table</h2>
              <p className="mt-3 max-w-[62ch] text-muted">
                More packs, room priority, match history, a badge for regulars
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:min-w-[250px]">
              <div className="flex items-end gap-2">
                <span className="display text-5xl text-foreground">$3</span>
                <span className="pb-2 text-muted">/ month</span>
              </div>
              <Button asChild>
                <Link href="/pricing">Unlock packs <Icon name="arrow" size={17} /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function GameStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl leading-none text-foreground">{value}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-muted">{label}</p>
    </div>
  );
}

function HeroTabletopImage() {
  return (
    <aside className="relative mx-auto w-full max-w-[690px] justify-self-center overflow-hidden rounded-[36px] bg-card lg:justify-self-end">
      <Image
        src="/assets/hero-movie-vote-panel.png"
        alt="Impostor voting panel with clues, timer, and one hidden impostor"
        width={1448}
        height={1086}
        priority
        sizes="(min-width: 1024px) 52vw, 92vw"
        className="h-full w-full object-contain"
      />
    </aside>
  );
}

function ModeTile({
  href,
  title,
  description,
  icon,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  icon: IconName;
  tone: "brand" | "cream" | "heat";
}) {
  const toneClass = {
    brand: "bg-brand text-brand-ink",
    cream: "bg-cream text-ink",
    heat: "bg-heat text-heat-ink",
  }[tone];
  return (
    <Link
      href={href}
      className="group block h-full rounded-[28px] bg-card p-6 transition-all duration-200 will-change-transform hover:-translate-y-0.5 hover:bg-card-hover active:translate-y-0 active:scale-[0.99]"
    >
      <div className={cn("grid size-11 place-items-center rounded-2xl", toneClass)}>
        <Icon name={icon} size={20} />
      </div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-1.5 text-[15px] text-muted">{description}</p>
    </Link>
  );
}

