"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"wins" | "impostor" | "games">("wins");

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("*")
        .gt("games_played", 0);

      if (tab === "wins") {
        query = query.order("group_wins", { ascending: false });
      } else if (tab === "impostor") {
        query = query.order("impostor_wins", { ascending: false });
      } else {
        query = query.order("games_played", { ascending: false });
      }

      const { data } = await query.limit(50);
      setLeaders(data ?? []);
      setLoading(false);
    }
    fetch();
  }, [supabase, tab]);

  function getValue(p: Profile): number {
    if (tab === "wins") return p.group_wins + p.impostor_wins;
    if (tab === "impostor") return p.impostor_wins;
    return p.games_played;
  }

  function getLabel(): string {
    if (tab === "wins") return "Total Wins";
    if (tab === "impostor") return "Impostor Wins";
    return "Games Played";
  }

  const tabData = [
    { key: "wins" as const, label: "🏆 Total Wins", color: "purple" },
    { key: "impostor" as const, label: "🕵️ Impostor Wins", color: "rose" },
    { key: "games" as const, label: "🎮 Games Played", color: "cyan" },
  ];

  return (
    <>
      <Header
        user={
          profile
            ? { username: profile.username, avatarColor: profile.avatar_color }
            : null
        }
      />
      <main className="min-h-screen bg-background pt-20 pb-12 px-4 relative overflow-hidden">
        <div className="absolute top-32 left-10 w-[300px] h-[300px] rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-20 right-10 w-[250px] h-[250px] rounded-full bg-orange/5 blur-3xl pointer-events-none" aria-hidden />

        <div className="mx-auto max-w-lg relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <h1 className="text-center font-heading text-4xl bg-gradient-to-r from-orange via-purple to-cyan bg-clip-text text-transparent mb-2">
              🏆 Leaderboard
            </h1>
            <p className="text-center text-muted mb-6">
              Top players across all games
            </p>
          </motion.div>

          <div className="flex gap-2 mb-6 justify-center flex-wrap">
            {tabData.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                  tab === t.key
                    ? `border-${t.color} bg-${t.color}/15 text-${t.color} shadow-[0_0_12px_rgba(168,85,247,0.15)]`
                    : "border-border text-muted hover:text-foreground hover:border-border"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-muted py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="inline-block text-3xl mb-3"
              >
                🔄
              </motion.div>
              <p>Loading...</p>
            </div>
          ) : leaders.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="text-4xl mb-3">🎮</div>
              <p className="text-muted">No data yet. Play some games!</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {leaders.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 200 }}
                >
                  <Card
                    padding="sm"
                    className={cn(
                      "flex items-center gap-3",
                      i === 0 && "border-orange/40 bg-orange/5 shadow-[0_0_20px_rgba(251,146,60,0.1)]",
                      i === 1 && "border-muted/40",
                      i === 2 && "border-orange-dim/30"
                    )}
                  >
                    <span
                      className={cn(
                        "font-heading text-lg w-8 text-center",
                        i < 3 ? "text-2xl" : "text-muted"
                      )}
                    >
                      {i < 3 ? MEDAL_EMOJIS[i] : i + 1}
                    </span>
                    <Avatar
                      name={p.username}
                      color={p.avatar_color}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-foreground flex-1">
                      {p.username}
                    </span>
                    <div className="text-right">
                      <p className="font-heading text-lg text-purple">
                        {getValue(p)}
                      </p>
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
