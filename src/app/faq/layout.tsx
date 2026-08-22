import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to the questions we get asked most often, in one place.",
};

export default function FaqLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
