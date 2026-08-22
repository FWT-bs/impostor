import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Bug report, billing question, or just feedback — send us a message.",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
