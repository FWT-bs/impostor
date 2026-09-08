import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { JsonLd, breadcrumbLd, organizationLd, pageMetadata } from "@/lib/seo";
import { SITE_CONTACT_EMAIL } from "@/lib/site";
import { packWordCount, getPacks } from "@/lib/content/packs";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "About Imposter",
  description:
    "Imposter is an independent, browser-based social-deduction party game. Who makes it, how the topic packs are written, and how the game is run.",
  path: "/about",
  type: "article",
});

export default function AboutPage() {
  const packCount = getPacks().length;
  const wordCount = packWordCount();

  return (
    <ContentPage
      title="About Imposter"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
      ]}
      intro="Imposter is a small, independent game — a browser version of the secret-word bluffing games people have played around tables for years, rebuilt so a group can play on one phone or across the internet with no download."
      lastUpdated="September 2026"
    >
      <JsonLd data={[organizationLd, breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ])]} />

      <h2>What it is</h2>
      <p>
        Every player at the table gets the same secret word — except one, the
        impostor, who only gets the topic. Players give one-word clues, argue
        about who sounded fake, and vote. It&apos;s a game about describing
        something precisely without naming it, and about noticing when someone
        else can&apos;t. A full round takes five to ten minutes.
      </p>
      <p>
        There are two modes: <Link href="/local/setup">pass-and-play</Link> on a
        single shared device, and <Link href="/rooms">online rooms</Link> where
        every player is on their own screen and a four-letter code ties the table
        together. Read <Link href="/how-to-play">the full rules</Link> if
        you&apos;re new.
      </p>

      <h2>Who makes it</h2>
      <p>
        Imposter is built and maintained by a single independent developer. It
        isn&apos;t backed by a studio and isn&apos;t affiliated with any other
        party game. The project started as a way to play a table game with
        friends who weren&apos;t in the same room, and grew from there.
      </p>
      <p>
        If you want to reach the person behind it — feedback, a bug, a pack idea,
        a press question — the <Link href="/contact">contact page</Link> has the
        details, or email{" "}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>.
      </p>

      <h2>How the topic packs are made</h2>
      <p>
        There are currently <strong>{packCount} topic packs</strong> holding{" "}
        <strong>{wordCount} words</strong>. Each pack is written by hand, not
        scraped or generated. A word earns its place only if:
      </p>
      <ul>
        <li>
          nearly everyone can picture it instantly — no trivia, no jargon;
        </li>
        <li>
          it supports a range of honest clues, so the crew has room to be clever;
        </li>
        <li>
          and its pack has a clear enough theme that the impostor has a fighting
          chance from the pack name alone.
        </li>
      </ul>
      <p>
        Each word also carries a loose sub-theme (&ldquo;Ocean Animals&rdquo;,
        &ldquo;Birds of Prey&rdquo;) that&apos;s shown to the impostor as a faint
        hint. You can see every pack, its full word list, and pack-specific clue
        advice on the <Link href="/packs">topic packs</Link> page.
      </p>

      <h2>How the game is run</h2>
      <p>
        The game runs in your browser. Online play uses a realtime database to
        sync roles, clues and votes between devices; role assignment and results
        are validated on the server so the game state can&apos;t be tampered with
        from a browser. Public rooms that go quiet are cleared automatically after
        about ten minutes.
      </p>
      <p>
        Accounts are lightweight — you can play online as a guest without an
        email. What data the game stores, and why, is spelled out on the{" "}
        <Link href="/privacy">privacy page</Link>.
      </p>

      <h2>Supporting it</h2>
      <p>
        Imposter is free and stays free. It&apos;s funded by{" "}
        <Link href="/pricing">Imposter+</Link>, an optional subscription for
        extra packs and match history, and by unobtrusive display advertising on
        the informational pages. If you&apos;d like to help without paying, the
        best thing you can do is play a few rounds with friends and tell them
        where you found it.
      </p>
    </ContentPage>
  );
}
