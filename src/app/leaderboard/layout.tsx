import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See who's topping the table — wins, win rate, and games played.",
};

export default function LeaderboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
