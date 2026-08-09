"use client";

import { AppShell, DoodleMark, EmptyState, GameCard, PageHeader } from "@/components/game";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
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

  async function fetchLeaders(currentTab: RankingTab) {
    setLoading(true);
    let query = supabase.from("profiles").select("*").gt("games_played", 0);

    if (currentTab === "wins") query = query.order("total_wins", { ascending: false });
    else if (currentTab === "impostor") query = query.order("impostor_wins", { ascending: false });
    else if (currentTab === "crew") query = query.order("group_wins", { ascending: false });
    else query = query.order("games_played", { ascending: false });

    const { data } = await query.limit(50);
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
      }
    : null;

  return (
    <AppShell user={userSlot} mainClassName="max-w-6xl">
      <section className="relative">
        <DoodleMark kind="mask" className="right-20 top-24 hidden sm:block" color="var(--brand)" size={52} />
        <DoodleMark kind="eye" className="left-2 top-36 hidden md:block" color="var(--amber)" size={44} />
        <DoodleMark kind="trace" className="right-0 top-44 hidden md:block" color="var(--heat)" size={42} />
        <PageHeader
          align="center"
          eyebrow={<><Icon name="trophy" size={15} /> Rankings</>}
          title="Leaderboard"
          description="The players who keep surviving the table"
        />
      </section>

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
          <div className="paper-card relative z-[2] mt-[-12px] overflow-x-auto p-5">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-sm text-muted">
                  <th className="w-16 py-3 font-extrabold">#</th>
                  <th className="py-3 font-extrabold">Player</th>
                  <th className="py-3 font-extrabold"><Icon name="trophy" size={17} className="mr-2 inline text-amber" />Total wins</th>
                  <th className="py-3 font-extrabold"><Icon name="mask" size={17} className="mr-2 inline text-heat" />Impostor wins</th>
                  <th className="py-3 font-extrabold"><Icon name="chair" size={17} className="mr-2 inline text-aqua" />Crew wins</th>
                  <th className="py-3 font-extrabold">Games played</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((leader, index) => (
                  <tr key={leader.id} className="border-b border-border/70 last:border-b-0">
                    <td className="py-4 font-black text-muted">{index + 1}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={leader.username} color={leader.avatar_color} size="sm" />
                        <div>
                          <p className="font-extrabold text-foreground">{leader.username}</p>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-black", leader.impostor_wins > leader.group_wins ? "bg-heat/10 text-heat" : "bg-aqua/10 text-aqua")}>
                            {leader.impostor_wins > leader.group_wins ? "Impostor" : "Crew"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-black">{leader.total_wins}</td>
                    <td className="py-4 font-black text-heat">{leader.impostor_wins}</td>
                    <td className="py-4 font-black text-aqua">{leader.group_wins}</td>
                    <td className="py-4 font-black">{leader.games_played}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    { leader: leaders[1], rank: 2, height: "sm:h-44", tone: "cyan" as const },
    { leader: leaders[0], rank: 1, height: "sm:h-56", tone: "pink" as const },
    { leader: leaders[2], rank: 3, height: "sm:h-40", tone: "purple" as const },
  ].filter((item) => item.leader);

  return (
    <div className="grid items-end gap-4 sm:grid-cols-3">
      {podium.map(({ leader, rank, height, tone }) => (
        <motion.div
          key={leader.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rank * 0.06, duration: 0.35 }}
        >
          <GameCard accent={tone} className={cn("flex flex-col items-center justify-end p-5 text-center", height)}>
            <Badge variant={rank === 1 ? "pink" : rank === 2 ? "cyan" : "default"}>
              #{rank}
            </Badge>
            <div className="my-4">
              <Avatar name={leader.username} color={leader.avatar_color} size="lg" />
            </div>
            <h2 className="max-w-full truncate text-xl font-bold">{leader.username}</h2>
            <p className="mt-2 display text-5xl text-brand-2">{getValue(leader, tab)}</p>
            <p className="text-xs font-semibold text-muted">{getLabel(tab)}</p>
          </GameCard>
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
