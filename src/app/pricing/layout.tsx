import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Premium",
  description: "Unlock 40+ exclusive topic packs, priority rooms, and match history with Impostor Premium.",
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
