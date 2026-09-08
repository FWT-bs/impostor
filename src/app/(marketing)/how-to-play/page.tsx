import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { Button } from "@/components/ui/Button";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "How to Play Imposter — Full Rules",
  description:
    "The complete rules for Imposter, the secret-word party game. Setup, roles, the clue round, discussion, voting and scoring — plus player-count advice and house rules. Learn a full game in about two minutes.",
  path: "/how-to-play",
  keywords: [
    "how to play imposter",
    "imposter game rules",
    "secret word game rules",
    "social deduction party game",
    "word impostor game",
  ],
  type: "article",
});

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to play Imposter",
  description:
    "Imposter is a social-deduction party game for 3–10 players. Everyone gets the same secret word except one hidden impostor. Players give one-word clues, discuss, then vote on who the impostor is.",
  totalTime: "PT8M",
  step: [
    {
      "@type": "HowToStep",
      name: "Set up the round",
      text: "Choose 3–10 players and a topic pack. One player is secretly assigned the impostor. Everyone else sees the same secret word; the impostor sees only the pack name.",
    },
    {
      "@type": "HowToStep",
      name: "Give clues",
      text: "Going around the table, each player says one word or short phrase that relates to the secret word without naming it. The impostor must bluff a clue that fits.",
    },
    {
      "@type": "HowToStep",
      name: "Discuss",
      text: "Players talk openly about whose clue felt off, vague, or too safe. This is where the impostor is usually caught or slips through.",
    },
    {
      "@type": "HowToStep",
      name: "Vote",
      text: "Everyone points at the player they think is the impostor. If the group votes out the impostor, the crew wins. If they get it wrong or tie, the impostor wins.",
    },
  ],
};

export default function HowToPlayPage() {
  return (
    <ContentPage
      title="How to play Imposter"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/how-to-play", label: "How to play" },
      ]}
      intro="Imposter is a fast social-deduction game for 3 to 10 players. Everyone at the table shares one secret word — except a single hidden impostor, who has to fake it. This is the full rulebook; a round takes about five to ten minutes."
      lastUpdated="September 2026"
    >
      <JsonLd data={[howToLd, breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "How to play", path: "/how-to-play" },
      ])]} />

      <h2>What you need</h2>
      <p>
        Nothing but people and one device. Imposter runs entirely in the browser.
        There are two ways to play:
      </p>
      <ul>
        <li>
          <strong>Pass-and-play</strong> — everyone is in the same room and you
          share a single phone or tablet, passing it around so each player can
          privately see their role. No account needed.{" "}
          <Link href="/local/setup">Start a pass-and-play game.</Link>
        </li>
        <li>
          <strong>Online rooms</strong> — each player is on their own device. One
          person creates a room, shares the four-letter code, and everyone joins
          from wherever they are.{" "}
          <Link href="/rooms">Find or create a room.</Link>
        </li>
      </ul>
      <p>
        You need at least <strong>three players</strong> for a game to work, and
        the table caps at <strong>ten</strong>. Four to seven is the sweet spot —
        enough people to hide in, few enough that every clue matters.
      </p>

      <h2>The goal</h2>
      <p>
        There are two teams, and you don&apos;t know which one you&apos;re on
        until the round starts:
      </p>
      <ul>
        <li>
          <strong>The crew</strong> (everyone except the impostor) knows the
          secret word. Their job is to prove to each other that they know it —
          without saying it out loud — and to figure out who doesn&apos;t.
        </li>
        <li>
          <strong>The impostor</strong> only knows the topic pack (for example
          &ldquo;Ocean Animals&rdquo; or &ldquo;Fast Food&rdquo;). Their job is to
          blend in, work out the real word from other people&apos;s clues, and
          avoid the vote.
        </li>
      </ul>

      <h2>A round, step by step</h2>

      <h3>1. Deal the roles</h3>
      <p>
        Pick your player count and a{" "}
        <Link href="/packs">topic pack</Link> (or leave it on Random). The game
        secretly picks one player to be the impostor and one secret word from the
        pack. Each player looks at their screen in private:
      </p>
      <ul>
        <li>
          Crew members see the pack name <strong>and</strong> the secret word —
          say, <em>Movies → Titanic</em>.
        </li>
        <li>
          The impostor sees the pack name and a note that they are the impostor,
          plus a faint theme hint like <em>&ldquo;romance&rdquo;</em>. That hint
          is deliberately loose — it points in a direction without giving the word
          away.
        </li>
      </ul>
      <p>
        For bigger tables (roughly six or more) you can run{" "}
        <strong>two impostors</strong>. They don&apos;t know each other&apos;s
        identity, which makes the discussion phase much harder to read.
      </p>

      <h3>2. The clue round</h3>
      <p>
        Going around the table in order, each player gives <strong>one</strong>{" "}
        clue about the secret word. A clue is a single word or a very short
        phrase. The rules for a legal clue:
      </p>
      <ul>
        <li>Don&apos;t say the secret word or an obvious nickname for it.</li>
        <li>Don&apos;t spell it, rhyme it, or gesture it.</li>
        <li>
          It should be something that <em>only</em> makes sense if you know the
          word. &ldquo;Iceberg&rdquo; is a great clue for <em>Titanic</em>.
          &ldquo;Film&rdquo; is a terrible one — it&apos;s true of the whole pack.
        </li>
      </ul>
      <p>
        The impostor gives a clue on their turn like everybody else. Going later
        in the order is an advantage for them: they&apos;ve heard other clues and
        can echo the theme. Going first is dangerous.
      </p>
      <p>
        Imposter has three clue styles you can set before the game:{" "}
        <strong>Classic</strong> (a word or short phrase), <strong>Short</strong>{" "}
        (tight, two or three words max), and <strong>One word</strong> (exactly
        one word — no hiding in a sentence).
      </p>

      <h3>3. Discussion</h3>
      <p>
        Once every clue is in, the table talks. Usually there&apos;s a timer —
        60 seconds by default, adjustable from 30 to 300. This is the heart of the
        game. Good questions to ask out loud:
      </p>
      <ul>
        <li>Whose clue was so vague it would fit any word in the pack?</li>
        <li>Whose clue was suspiciously safe — technically correct, but cautious?</li>
        <li>
          Did someone&apos;s clue only make sense <em>after</em> they&apos;d heard
          two other clues?
        </li>
      </ul>
      <p>
        The crew is trying to surface the impostor. The impostor is trying to
        sound like a confident crew member — and, if they&apos;ve worked out the
        word, to quietly steer suspicion onto someone else.
      </p>

      <h3>4. The vote</h3>
      <p>
        Everyone votes at the same time for the player they believe is the
        impostor (there&apos;s a voting timer too, 30 seconds by default). Then
        the roles are revealed.
      </p>

      <h2>Scoring and who wins</h2>
      <ul>
        <li>
          <strong>The crew wins</strong> if the most-voted player is the impostor
          — with a clear majority, no tie.
        </li>
        <li>
          <strong>The impostor wins</strong> if the crew votes out an innocent
          player, <em>or</em> if the top vote is a tie, <em>or</em> if nobody
          gets enough votes.
        </li>
      </ul>
      <p>
        In online play, results feed the{" "}
        <Link href="/leaderboard">leaderboard</Link> — total wins, wins as the
        impostor, wins as crew, and games played are all tracked per account. In
        pass-and-play the game keeps a running score for the current session and
        then resets.
      </p>

      <h2>How many players should you have?</h2>
      <ul>
        <li>
          <strong>3 players:</strong> playable but tense — the impostor has a
          one-in-three baseline and very little cover. Good for a quick round.
        </li>
        <li>
          <strong>4–5 players:</strong> the classic experience. One impostor, fast
          rounds, every clue readable.
        </li>
        <li>
          <strong>6–8 players:</strong> the best group size. Consider two
          impostors here. Discussion gets genuinely chaotic.
        </li>
        <li>
          <strong>9–10 players:</strong> run two impostors, use the{" "}
          <strong>Short</strong> or <strong>One word</strong> clue style, and keep
          the discussion timer tight so the round doesn&apos;t drag.
        </li>
      </ul>

      <h2>House rules worth trying</h2>
      <ul>
        <li>
          <strong>Sudden-death clue:</strong> if the vote ties, give each
          suspected player one more clue and re-vote.
        </li>
        <li>
          <strong>Impostor steal:</strong> if the impostor is caught but can
          correctly name the secret word on the spot, they still win.
        </li>
        <li>
          <strong>No repeats:</strong> a clue that&apos;s already been said is
          illegal — it forces late players to actually commit.
        </li>
        <li>
          <strong>Category roulette:</strong> nobody picks the pack; the game
          rolls it. Crew and impostor are both slightly off balance.
        </li>
      </ul>

      <h2>Next steps</h2>
      <p>
        Once you know the rules, the game is all about clue craft. Read the{" "}
        <Link href="/strategy">Imposter strategy guide</Link> for how to bluff as
        the impostor and how to catch one as the crew, or browse the{" "}
        <Link href="/packs">topic packs</Link> to see the word lists and
        pack-specific tips.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/local/setup">Start a game</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/strategy">Read the strategy guide</Link>
        </Button>
      </div>
    </ContentPage>
  );
}
