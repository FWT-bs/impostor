import type { Metadata } from "next";
import { Gabarito } from "next/font/google";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";
import { ImposterIntro } from "@/components/intro/ImposterIntro";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const gabarito = Gabarito({
  variable: "--font-app-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Impostor - Social Deduction Party Game",
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
      data-theme="tabletop-dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${gabarito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme='tabletop-dark';localStorage.setItem('impostor-theme','dark')}catch(e){}",
          }}
        />
        <div className="bg-field" aria-hidden />
        <MotionConfig reducedMotion="user">
          <AuthProvider>
            {children}
          </AuthProvider>
        </MotionConfig>
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
