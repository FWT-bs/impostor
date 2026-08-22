import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Play local",
  description: "Set up a pass-and-play round for your group — pick players, names, and a topic pack.",
};

export default function LocalSetupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
