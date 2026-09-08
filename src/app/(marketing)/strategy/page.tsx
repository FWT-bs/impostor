import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { Button } from "@/components/ui/Button";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Imposter Strategy Guide — Bluffing & Detection",
  description:
    "How to win at Imposter. Clue-craft for the crew, bluffing technique for the impostor, the tells that give players away, and voting tactics for tables of every size.",
  path: "/strategy",
  keywords: [
    "imposter strategy",
    "how to win imposter",
    "social deduction tips",
    "how to bluff impostor game",
    "spot the impostor",
  ],
  type: "article",
});

export default function StrategyPage() {
  return (
    <ContentPage
      title="Imposter strategy guide"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/strategy", label: "Strategy" },
      ]}
      intro="Once everyone knows the rules, Imposter becomes a game of clue craft and nerve. Here is how to give clues that prove you're crew, how to bluff convincingly when you're not, and how to read the table at vote time."
      lastUpdated="September 2026"
    >
      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Strategy", path: "/strategy" },
      ])} />

      <p>
        New to the game? Start with the{" "}
        <Link href="/how-to-play">full rules</Link>. This guide assumes you know
        how a round flows.
      </p>

      <h2>Playing as the crew</h2>

      <h3>Give a clue only a crew member could give</h3>
      <p>
        The single most common mistake is a clue that&apos;s technically about the
        word but would fit half the pack. If the word is <em>Dolphin</em> and you
        say &ldquo;ocean&rdquo;, you&apos;ve told the impostor the category they
        already had. Say &ldquo;echolocation&rdquo; or &ldquo;pod&rdquo; or
        &ldquo;flips&rdquo; — something that lands on <em>this</em> animal and
        nothing else.
      </p>
      <p>
        A useful test before you speak: <em>could I give this exact clue if I
        were the impostor and only knew the pack?</em> If yes, it&apos;s too weak.
      </p>

      <h3>Don&apos;t over-share</h3>
      <p>
        The opposite failure is the clue that basically says the word. If you go
        &ldquo;Leonardo&rdquo; for <em>Titanic</em>, the impostor now knows the
        word and can coast. Strong crew play is a clue that&apos;s{" "}
        <strong>unmistakable to someone who knows the word and useless to
        someone who doesn&apos;t</strong>. &ldquo;Iceberg&rdquo; does that.
        &ldquo;Leonardo&rdquo; does not.
      </p>

      <h3>Use clue order</h3>
      <ul>
        <li>
          <strong>Going first?</strong> You have the least information but the
          most credibility — nobody can accuse you of copying. Give a mid-strength
          clue: specific enough to be real, not so specific you hand over the
          word.
        </li>
        <li>
          <strong>Going last?</strong> You&apos;ve heard everyone. If the earlier
          clues were all solid, match their specificity. If someone was vague,
          you now have a read to bring to the discussion.
        </li>
      </ul>

      <h3>Watch for the echo</h3>
      <p>
        Impostors survive the clue round by <em>echoing</em> — taking the theme of
        earlier clues and reflecting it back one step later. If two people say
        &ldquo;cold&rdquo; and &ldquo;flippers&rdquo; and the next player says
        &ldquo;Antarctica&rdquo;, ask yourself whether that&apos;s knowledge or an
        educated bounce off the previous two.
      </p>

      <h3>In the discussion, commit</h3>
      <p>
        Wishy-washy crew members look exactly like impostors. If you have a read,
        say it and say why: &ldquo;Sam&apos;s clue was &lsquo;interesting&rsquo; —
        that&apos;s not a clue, that&apos;s a stall.&rdquo; A wrong accusation with
        clear reasoning is better for your team than silence.
      </p>

      <h2>Playing as the impostor</h2>

      <h3>Buy time on your first clue</h3>
      <p>
        If you&apos;re early in the order and have no read yet, give a clue that
        works for a wide slice of the pack but still sounds committed. For an
        animal pack: &ldquo;wild&rdquo;, &ldquo;fast&rdquo;, &ldquo;grey&rdquo;.
        Say it with the same confidence a crew member would. Hesitation is a
        bigger tell than a slightly generic word.
      </p>

      <h3>Mine the clues, then narrow</h3>
      <p>
        Every crew clue is information. By the time it&apos;s your turn — or by
        the discussion — you can often reconstruct the word. Once you&apos;re
        fairly sure, your later contributions should tighten to match, so your
        arc looks like a crew member warming up rather than a stranger guessing.
      </p>

      <h3>Never be the vaguest person at the table</h3>
      <p>
        Crews don&apos;t catch impostors by logic alone; they catch the{" "}
        <em>weakest clue</em>. If everyone else is being specific, a safe clue
        stands out like a flare. It is often better to give a confident{" "}
        <em>wrong-ish</em> clue than an obviously hedged one — a crew member who
        misreads the room is believable; a person saying nothing is not.
      </p>

      <h3>Redirect, don&apos;t defend</h3>
      <p>
        When accused, over-defending reads as guilty. Acknowledge it
        (&ldquo;yeah, my clue was weak&rdquo;) and pivot to a real observation
        about someone else&apos;s clue. If you&apos;ve worked out the word, you
        can even prove &ldquo;knowledge&rdquo; by referencing it obliquely in the
        discussion — something only a crew member would land.
      </p>

      <h3>With two impostors</h3>
      <p>
        You don&apos;t know who your partner is. Don&apos;t try to coordinate —
        you&apos;ll both draw heat. Play your own game; a second impostor mostly
        helps by splitting the crew&apos;s suspicion naturally.
      </p>

      <h2>The tells</h2>
      <ul>
        <li>
          <strong>The category clue.</strong> Someone restates the pack
          (&ldquo;it&apos;s a sport&rdquo;) instead of the word. Almost always the
          impostor stalling.
        </li>
        <li>
          <strong>The late bloom.</strong> A player is vague in the clue round,
          then suddenly precise in the discussion once the word is obvious.
        </li>
        <li>
          <strong>The over-defense.</strong> Long, detailed justifications for a
          short clue.
        </li>
        <li>
          <strong>The echo.</strong> A clue that only works as a response to the
          two clues before it.
        </li>
        <li>
          <strong>The non-answer.</strong> &ldquo;Interesting&rdquo;,
          &ldquo;classic&rdquo;, &ldquo;iconic&rdquo; — words that sound like
          clues but carry no information.
        </li>
      </ul>
      <p>
        And the counter-tell: strong players sometimes give a deliberately mild
        clue as crew, precisely to bait an accusation. Weigh the clue against how
        that person plays.
      </p>

      <h2>Voting tactics</h2>
      <ul>
        <li>
          <strong>Small tables (3–4):</strong> trust the clue round over the
          discussion. There&apos;s not enough talk to hide a bad clue.
        </li>
        <li>
          <strong>Medium (5–7):</strong> the discussion matters most. Track who
          drove the conversation and who just agreed.
        </li>
        <li>
          <strong>Large (8–10) with two impostors:</strong> don&apos;t dogpile
          the first suspect. A tie hands the round to the impostors, so a split
          vote is a loss — get to a majority or don&apos;t bother.
        </li>
      </ul>
      <p>
        Remember the win condition: as crew you need a clean majority on the
        actual impostor. A confident wrong vote and a tie both lose. When in
        doubt between two suspects, the one with the more <em>information-free</em>{" "}
        clue is the better bet.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/local/setup">Practise a round</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/packs">Browse topic packs</Link>
        </Button>
      </div>
    </ContentPage>
  );
}
