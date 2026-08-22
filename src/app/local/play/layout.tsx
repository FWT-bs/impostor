import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Local round",
  description: "Pass-and-play in progress — check your role, give your clue, and vote out the impostor.",
};

export default function LocalPlayLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
