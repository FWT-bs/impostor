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

  return (
    <>
      <Header
        user={
          profile
            ? { username: profile.username, avatarColor: profile.avatar_color }
            : null
        }
      />
      <main className="min-h-screen bg-background pt-20 pb-12 px-4">
        <div className="mx-auto max-w-lg">
          <h1 className="text-center text-4xl text-teal mb-2">Leaderboard</h1>
          <p className="text-center text-muted mb-6">
            Top players across all games
          </p>

          <div className="flex gap-2 mb-6 justify-center">
            {(["wins", "impostor", "games"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  tab === t
                    ? "border-teal bg-teal/15 text-teal"
                    : "border-border text-muted hover:text-foreground"
                )}
              >
                {t === "wins"
                  ? "Total Wins"
                  : t === "impostor"
                    ? "Impostor Wins"
                    : "Games Played"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-muted py-12">Loading...</div>
          ) : leaders.length === 0 ? (
            <Card padding="lg" className="text-center">
              <p className="text-muted">No data yet. Play some games!</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {leaders.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    padding="sm"
                    className={cn(
                      "flex items-center gap-3",
                      i === 0 && "border-amber/40 bg-amber/5",
                      i === 1 && "border-muted/40",
                      i === 2 && "border-amber-dim/30"
                    )}
                  >
                    <span
                      className={cn(
                        "font-heading text-lg w-8 text-center",
                        i === 0
                          ? "text-amber"
                          : i === 1
                            ? "text-foreground"
                            : i === 2
                              ? "text-amber-dim"
                              : "text-muted"
                      )}
                    >
                      {i + 1}
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
                      <p className="font-heading text-lg text-teal">
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
