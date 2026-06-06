import type { Metadata } from "next";
import { Anton, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

// Heavy condensed display face for the wordmark and big "live" moments.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

// Headline + body — a sharp, modern grotesk that reads active and alive.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Impostor — Social Deduction Party Game",
  description:
    "Find the impostor among your friends. A thrilling party game of bluffing, deduction, and deception.",
  icons: {
    icon: [{ url: "/impostor.png", type: "image/png" }],
    apple: [{ url: "/impostor.png", type: "image/png" }],
  },
};

/** Auth uses cookies; avoid caching HTML/RSC shells that ignore Set-Cookie / session. */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="voltage"
      className={`${anton.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Ambient field: drifting grid + dual halos that make the room feel alive */}
        <div className="bg-field" aria-hidden />
        <div className="bg-grid" aria-hidden />
        {/* Grain overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-[999]"
          aria-hidden
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: 0.03,
          }}
        />
        <MotionConfig reducedMotion="user">
          <AuthProvider>
            {children}
          </AuthProvider>
        </MotionConfig>
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#161226",
              border: "1px solid #2a2350",
              color: "#f3f1ff",
              borderRadius: "14px",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
