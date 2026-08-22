"use client";

import { AppShell, EmptyState, GameCard, PageHeader } from "@/components/game";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { getAuthAvatarColor, getAuthAvatarUrl, getAuthDisplayName } from "@/lib/auth-display-name";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type RankingTab = "wins" | "impostor" | "crew" | "games";

const tabs: { key: RankingTab; label: string }[] = [
  { key: "wins", label: "Total Wins" },
  { key: "impostor", label: "Impostor Wins" },
  { key: "crew", label: "Crew Wins" },
  { key: "games", label: "Games Played" },
];

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<RankingTab>("wins");

  function rankedQuery(currentTab: RankingTab) {
    let query = supabase.from("profiles").select("*").gt("games_played", 0);
    if (currentTab === "wins") query = query.order("total_wins", { ascending: false });
    else if (currentTab === "impostor") query = query.order("impostor_wins", { ascending: false });
    else if (currentTab === "crew") query = query.order("group_wins", { ascending: false });
    else query = query.order("games_played", { ascending: false });
    return query;
  }

  async function fetchLeaders(currentTab: RankingTab) {
    setLoading(true);
    const { data, error } = await rankedQuery(currentTab).eq("show_on_leaderboard", true).limit(50);
    if (error) {
      // The show_on_leaderboard column may not be migrated yet on this
      // project — fall back to showing everyone rather than an empty page.
      console.warn("leaderboard visibility filter unavailable:", error.message);
      const { data: fallback } = await rankedQuery(currentTab).limit(50);
      setLeaders(fallback ?? []);
      setLoading(false);
      return;
    }
    setLeaders(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    function scheduleRefetch() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void fetchLeaders(tab);
      }, 400);
    }

    void fetchLeaders(tab);

    const channel = supabase
      .channel("leaderboard-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => scheduleRefetch())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => scheduleRefetch())
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, tab]);

  const userSlot = user
    ? {
        username: getAuthDisplayName(user, profile),
        avatarColor: getAuthAvatarColor(user, profile),
        avatarUrl: getAuthAvatarUrl(user, profile),
      }
    : null;

  return (
    <AppShell user={userSlot} mainClassName="max-w-6xl">
      <PageHeader
        title="Table legends"
        description="The players who keep surviving the vote"
      />

      <div className="mb-7 flex justify-center">
        <Tabs value={tab} onValueChange={(value) => setTab(value as RankingTab)}>
          <TabsList className="flex flex-wrap justify-center">
            {tabs.map((item) => (
              <TabsTrigger key={item.key} value={item.key}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <GameCard className="mx-auto max-w-md p-8 text-center" accent="purple">
          <h2 className="text-xl font-bold">Loading rankings</h2>
          <p className="mt-2 text-sm text-muted">Counting table legends</p>
        </GameCard>
      ) : leaders.length === 0 ? (
        <EmptyState
          icon="trophy"
          title="No legends yet"
          text="Play an online match to claim the first spot"
          action={
            <Button asChild>
              <Link href="/rooms">Find a room</Link>
            </Button>
          }
        />
      ) : (
        <>
          <TopPodium leaders={leaders.slice(0, 3)} tab={tab} />
          <div className="mt-4 flex flex-col gap-2">
            {leaders.slice(3).map((leader, index) => {
              const isYou = user?.id === leader.id;
              return (
                <div
                  key={leader.id}
                  className={cn(
                    "flex items-center gap-4 rounded-[24px] px-5 py-4",
                    isYou ? "bg-cream text-ink" : "bg-card text-foreground",
                  )}
                >
                  <span className={cn("w-7 text-lg font-bold", !isYou && "text-muted")}>{index + 4}</span>
                  <Avatar name={leader.username} color={leader.avatar_color} imageUrl={leader.avatar_url} size="sm" />
                  <span className="flex-1 truncate text-lg font-bold">
                    {leader.username}
                    {isYou && (
                      <span className="ml-2 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-cream">you</span>
                    )}
                  </span>
                  <span className={cn("mr-1 hidden text-sm sm:inline", isYou ? "text-ink/70" : "text-muted")}>
                    {leader.impostor_wins} as impostor
                  </span>
                  <span className="display text-xl">{getValue(leader, tab)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}

function TopPodium({
  leaders,
  tab,
}: {
  leaders: Profile[];
  tab: RankingTab;
}) {
  const podium = [
    { leader: leaders[1], rank: 2, first: false },
    { leader: leaders[0], rank: 1, first: true },
    { leader: leaders[2], rank: 3, first: false },
  ].filter((item) => item.leader);

  return (
    <div className="grid items-end gap-4 sm:grid-cols-3">
      {podium.map(({ leader, rank, first }) => (
        <motion.div
          key={leader.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rank * 0.06, duration: 0.35 }}
        >
          <div
            className={cn(
              "rounded-[32px] text-center",
              first ? "bg-brand py-9 px-6 text-brand-ink" : "bg-card py-7 px-6 text-foreground",
            )}
          >
            <Avatar
              name={leader.username}
              color={leader.avatar_color}
              imageUrl={leader.avatar_url}
              size={first ? "lg" : "md"}
            />
            <h2 className={cn("mt-3 truncate font-bold", first ? "text-2xl" : "text-xl")}>{leader.username}</h2>
            <p className={cn("display mt-1.5", first ? "text-5xl" : "text-4xl")}>{getValue(leader, tab)}</p>
            <p className={cn("text-sm font-semibold", first ? "opacity-75" : "text-muted")}>{getLabel(tab)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function getValue(profile: Profile, tab: RankingTab): number {
  if (tab === "wins") return profile.total_wins;
  if (tab === "impostor") return profile.impostor_wins;
  if (tab === "crew") return profile.group_wins;
  return profile.games_played;
}

function getLabel(tab: RankingTab): string {
  if (tab === "wins") return "Total wins";
  if (tab === "impostor") return "Impostor wins";
  if (tab === "crew") return "Crew wins";
  return "Games played";
}
