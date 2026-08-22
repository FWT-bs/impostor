import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Game lobby",
  description: "Join your table, get ready, and wait for the host to start the round.",
  robots: { index: false, follow: false },
};

export default function RoomCodeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
