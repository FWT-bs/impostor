"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const RANK_COLORS = ["#ffb23d", "#aab0d8", "#e07b3d"];
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
      <main className="mx-auto max-w-lg px-5 pt-28 pb-16">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 text-center"
          >
            <div className="mb-3 flex justify-center"><Chip tone="brand" icon="trophy">Rankings</Chip></div>
            <h1 className="display mb-2" style={{ fontSize: "clamp(40px,8vw,72px)" }}>LEADERBOARD</h1>
            <p className="text-sm text-muted">Top players across every game</p>
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
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <span className="livedot" />
              <p className="text-sm text-muted">Loading rankings…</p>
            </div>
          ) : leaders.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="role-ic mx-auto mb-4" style={{ width: 56, height: 56, ["--c" as string]: "var(--brand)", background: "linear-gradient(150deg, var(--brand), color-mix(in oklab, var(--brand) 55%, #000))" }}>
                <Icon name="trophy" size={26} />
              </div>
              <p className="text-sm text-muted">No data yet. Play some games!</p>
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
                        <span className="display text-xl" style={{ color: RANK_COLORS[i] }}>
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
