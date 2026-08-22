import type { Metadata } from "next";
import { Gabarito } from "next/font/google";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";
import { ImposterIntro } from "@/components/intro/ImposterIntro";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Footer } from "@/components/layout/Footer";
import { SiteWidgets } from "@/components/layout/SiteWidgets";
import "./globals.css";

const gabarito = Gabarito({
  variable: "--font-app-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://imposterlive.com"),
  title: {
    default: "Impostor - Social Deduction Party Game",
    template: "%s · Impostor",
  },
  description:
    "Find the impostor among your friends. A thrilling party game of bluffing, deduction, and deception.",
  // favicon.ico, icon.png, and apple-icon.png in src/app/ are picked up automatically.
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
      data-theme="tabletop-dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${gabarito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('impostor-theme')==='light'?'tabletop':'tabletop-dark';document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-brand-ink focus:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        >
          Skip to content
        </a>
        <div className="bg-field" aria-hidden />
        <MotionConfig reducedMotion="user">
          <AuthProvider>
            <div className="flex min-h-full flex-1 flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
          </AuthProvider>
        </MotionConfig>
        <SiteWidgets />
        <ImposterIntro />
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: "16px",
              fontSize: "14px",
              boxShadow: "0 18px 44px rgba(14, 28, 48, 0.16)",
            },
          }}
        />
      </body>
    </html>
  );
}
