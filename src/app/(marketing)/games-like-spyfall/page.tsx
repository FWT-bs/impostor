import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { Button } from "@/components/ui/Button";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Games Like Spyfall — Social Deduction Compared",
  description:
    "How Imposter compares to Spyfall, The Chameleon, Wavelength and other hidden-role party games — and which one fits your group, your table size and your time budget.",
  path: "/games-like-spyfall",
  keywords: [
    "games like spyfall",
    "games like the chameleon",
    "social deduction party games",
    "hidden role games",
    "word deduction game",
  ],
  type: "article",
});

export default function GamesLikeSpyfallPage() {
  return (
    <ContentPage
      title="Games like Spyfall"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/games-like-spyfall", label: "Games like Spyfall" },
      ]}
      intro="Hidden-role deduction games all share one hook: someone at the table is missing a piece of information and has to fake it. They differ a lot in pace, setup and group size. Here's how the well-known ones stack up, and where Imposter fits."
      lastUpdated="September 2026"
      wide
    >
      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Games like Spyfall", path: "/games-like-spyfall" },
      ])} />

      <h2>The quick comparison</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-2">
              <th className="py-2 pr-4 font-semibold">Game</th>
              <th className="py-2 pr-4 font-semibold">Hidden thing</th>
              <th className="py-2 pr-4 font-semibold">Players</th>
              <th className="py-2 font-semibold">Round length</th>
            </tr>
          </thead>
          <tbody className="text-muted">
            <tr className="border-b border-border/60">
              <td className="py-2 pr-4 font-semibold text-foreground">Imposter</td>
              <td className="py-2 pr-4">A secret word</td>
              <td className="py-2 pr-4">3–10</td>
              <td className="py-2">5–10 min</td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="py-2 pr-4 font-semibold text-foreground">Spyfall</td>
              <td className="py-2 pr-4">A location</td>
              <td className="py-2 pr-4">3–8</td>
              <td className="py-2">8–15 min</td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="py-2 pr-4 font-semibold text-foreground">The Chameleon</td>
              <td className="py-2 pr-4">A word on a grid</td>
              <td className="py-2 pr-4">3–8</td>
              <td className="py-2">5–15 min</td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="py-2 pr-4 font-semibold text-foreground">Wavelength</td>
              <td className="py-2 pr-4">A hidden target on a dial</td>
              <td className="py-2 pr-4">2–12</td>
              <td className="py-2">Full session</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-semibold text-foreground">Werewolf / Mafia</td>
              <td className="py-2 pr-4">Player roles</td>
              <td className="py-2 pr-4">7–20+</td>
              <td className="py-2">15–45 min</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Spyfall</h2>
      <p>
        The reference point for this genre. Everyone gets the same location — a
        casino, a submarine, a hospital — except the spy. Players take turns
        asking each other pointed questions (&ldquo;Would you bring a child
        here?&rdquo;) and judging the answers. The spy wins by surviving or by
        guessing the location.
      </p>
      <p>
        Spyfall&apos;s strength is the interrogation: it&apos;s a talky, bluffy
        game with real back-and-forth. Its costs are setup and length —
        rounds run longer, and it leans on a confident group that&apos;s happy
        improvising questions. It also doesn&apos;t scale past eight well.
      </p>

      <h2>The Chameleon</h2>
      <p>
        The closest relative to Imposter. There&apos;s a grid of 16 related
        words; a rolled code tells everyone but the chameleon which one is the
        secret. Each player says one word about it, then everyone votes.
      </p>
      <p>
        The Chameleon and Imposter are the same core game. Where Imposter
        differs: the impostor gets a loose theme hint rather than nothing, so
        they&apos;re bluffing with a foothold; clue style is adjustable (a full
        phrase, a tight phrase, or exactly one word); there are discussion and
        voting timers; you can run two impostors on a big table; and it plays
        across devices online with a leaderboard, not just around one table.
      </p>

      <h2>Wavelength</h2>
      <p>
        A different shape — cooperative-ish, and about calibrating language
        rather than catching a liar. One player sees where a target sits on a
        spectrum (&ldquo;underrated&nbsp;→&nbsp;overrated&rdquo;) and gives a clue
        to help their team guess the spot. No hidden traitor. Reach for it when
        your group wants something warmer and less confrontational.
      </p>

      <h2>Werewolf and Mafia</h2>
      <p>
        The heavyweight of social deduction: night phases, special roles, player
        elimination, a moderator. Brilliant with a big, committed group and a lot
        of time; overkill for six people with twenty minutes. Imposter is the
        game you play <em>while you wait</em> for enough people to show up for
        Werewolf.
      </p>

      <h2>Where Imposter fits</h2>
      <ul>
        <li>
          <strong>Least setup.</strong> No cards, no grid, no moderator, no
          location list to agree on. Open a tab, pick a player count, go.
        </li>
        <li>
          <strong>Shortest round.</strong> One clue each, a short discussion, a
          vote. Five minutes if you want it to be.
        </li>
        <li>
          <strong>Widest range.</strong> Three players up to ten, one shared
          phone or ten separate devices.
        </li>
        <li>
          <strong>Tunable difficulty.</strong> The clue style and impostor count
          let you dial the challenge for the room you&apos;re in.
        </li>
      </ul>
      <p>
        If your group loves the interrogation of Spyfall, keep playing Spyfall.
        If you want a hidden-role game you can start in ten seconds and finish
        before the pizza arrives, that&apos;s the gap Imposter fills. Read{" "}
        <Link href="/how-to-play">how to play</Link> or{" "}
        <Link href="/packs">browse the topic packs</Link>.
      </p>

      <div className="not-prose mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/local/setup">Try a round</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/strategy">Strategy guide</Link>
        </Button>
      </div>
    </ContentPage>
  );
}
