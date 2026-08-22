import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Online rooms",
  description: "Browse open tables or create a private room to play Impostor online with friends.",
};

export default function RoomsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
