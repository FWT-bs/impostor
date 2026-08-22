import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign back in to return to your table.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
