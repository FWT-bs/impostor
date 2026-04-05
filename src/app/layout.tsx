import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Impostor — Social Deduction Party Game",
  description:
    "Find the impostor among your friends. A thrilling party game of bluffing, deduction, and deception.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${rajdhani.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#151730",
              border: "2px solid #2a2e55",
              color: "#ebedf7",
              borderRadius: "16px",
            },
          }}
        />
      </body>
    </html>
  );
}
