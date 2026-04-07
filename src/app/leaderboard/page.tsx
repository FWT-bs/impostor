"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { FloatingCharacter } from "@/components/ui/FloatingCharacter";
import { DetectiveFull, ImpostorMini, GhostMini } from "@/components/ui/Characters";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const RANK_COLORS = ["#c9956a", "#8a9aaa", "#b87333"];
const RANK_LABELS = ["1st", "2nd", "3rd"];

const tabs = [
  { key: "wins" as const, label: "Total Wins" },
  { key: "impostor" as const, label: "Impostor Wins" },
  { key: "games" as const, label: "Games Played" },
];

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"wins" | "impostor" | "games">("wins");

  async function fetchLeaders(currentTab: typeof tab) {
    setLoading(true);
    let query = supabase.from("profiles").select("*").gt("games_played", 0);

    if (currentTab === "wins") {
      query = query.order("total_wins", { ascending: false });
    } else if (currentTab === "impostor") {
      query = query.order("impostor_wins", { ascending: false });
    } else {
      query = query.order("games_played", { ascending: false });
    }

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
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => scheduleRefetch(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, tab]);

  function getValue(p: Profile): number {
    if (tab === "wins") return p.total_wins;
    if (tab === "impostor") return p.impostor_wins;
    return p.games_played;
  }

  function getLabel(): string {
    if (tab === "wins") return "Total Wins";
    if (tab === "impostor") return "Impostor Wins";
    return "Games Played";
  }

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
      <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-32 left-10 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-orange/5 blur-3xl pointer-events-none" aria-hidden />

        {/* Detective character decoration */}
        <FloatingCharacter
          from="right"
          delay={0.3}
          floatAmplitude={12}
          floatDuration={5}
          sway
          className="absolute right-4 top-24 hidden xl:block"
        >
          <DetectiveFull className="w-32 opacity-20" />
        </FloatingCharacter>

        {/* Ambient minis */}
        <FloatingCharacter from="left" delay={0.5} floatAmplitude={9} floatDuration={4.5} className="absolute left-6 bottom-24 hidden lg:block">
          <ImpostorMini className="w-10 opacity-15" />
        </FloatingCharacter>
        <FloatingCharacter from="right" delay={0.8} floatAmplitude={14} floatDuration={6} className="absolute right-8 bottom-32 hidden lg:block">
          <GhostMini className="w-10 opacity-15" />
        </FloatingCharacter>

        <div className="mx-auto max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-muted/60 mb-3">Rankings</p>
            <h1 className="font-heading text-4xl text-foreground mb-2">Leaderboard</h1>
            <p className="text-sm text-muted">Top players across all games</p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            className="flex gap-2 mb-6 justify-center flex-wrap"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 cursor-pointer",
                  tab === t.key
                    ? "bg-purple/15 text-purple border border-purple/30"
                    : "border border-border text-muted hover:text-foreground hover:border-border/80",
                )}
              >
                {t.label}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <svg
                className="size-8 animate-spin text-purple/60"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-muted">Loading rankings...</p>
            </div>
          ) : leaders.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="w-12 h-12 rounded-full bg-card-hover border border-border flex items-center justify-center mx-auto mb-4">
                <svg className="size-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <p className="text-muted text-sm">No data yet. Play some games!</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {leaders.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Card
                    padding="sm"
                    className={cn(
                      "flex items-center gap-3",
                      i === 0 && "border-orange/25 bg-orange/[0.04]",
                    )}
                  >
                    {/* Rank */}
                    <div className="w-9 text-center shrink-0">
                      {i < 3 ? (
                        <span
                          className="font-display text-xl"
                          style={{ color: RANK_COLORS[i], fontFamily: "var(--font-bebas), sans-serif" }}
                        >
                          {RANK_LABELS[i]}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-muted">{i + 1}</span>
                      )}
                    </div>

                    <Avatar name={p.username} color={p.avatar_color} size="sm" />

                    <span className="text-sm font-medium text-foreground flex-1 truncate">
                      {p.username}
                    </span>

                    <div className="text-right shrink-0">
                      <p className="font-heading text-lg text-purple">{getValue(p)}</p>
                      <p className="text-xs text-muted">{getLabel()}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
