import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="tabletop-page flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="display text-[clamp(3rem,12vw,5rem)] leading-none text-brand">
          404
        </p>
        <h1 className="display mt-4 text-2xl text-foreground sm:text-3xl">
          This page slipped past the vote
        </h1>
        <p className="mt-3 max-w-md text-muted">
          The page you&apos;re after doesn&apos;t exist, or the room it lived in
          has already closed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/how-to-play">How to play</Link>
          </Button>
        </div>
        <nav className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-2">
          <Link href="/packs" className="hover:text-foreground">
            Topic packs
          </Link>
          <Link href="/rooms" className="hover:text-foreground">
            Online rooms
          </Link>
          <Link href="/leaderboard" className="hover:text-foreground">
            Leaderboard
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
