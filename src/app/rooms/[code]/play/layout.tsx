import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Playing",
  description: "Give your clue, vote, and catch the impostor.",
  robots: { index: false, follow: false },
};

export default function RoomPlayLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
