import type { Metadata } from "next";
import { Gabarito } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";
import { ImposterIntro } from "@/components/intro/ImposterIntro";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ADSENSE_CLIENT } from "@/lib/ads";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const gabarito = Gabarito({
  variable: "--font-app-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — The Secret-Word Bluffing Party Game`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "imposter",
    "impostor game",
    "party game",
    "social deduction game",
    "secret word game",
    "games like spyfall",
    "the chameleon game",
    "online party game",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — The Secret-Word Bluffing Party Game`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — The Secret-Word Bluffing Party Game`,
    description: SITE_DESCRIPTION,
  },
  // Icons are provided by the app/icon.png and app/apple-icon.png file
  // conventions.
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
        <Script
          id="adsbygoogle-loader"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
          async
        />
      </body>
    </html>
  );
}
