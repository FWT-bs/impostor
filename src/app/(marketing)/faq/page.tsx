import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { JsonLd, breadcrumbLd, faqLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Imposter FAQ — Common Questions",
  description:
    "Answers to common questions about Imposter: how many players you need, whether it's free, how it differs from Spyfall and The Chameleon, do you need an account, and how online rooms work.",
  path: "/faq",
  keywords: ["imposter faq", "imposter game questions", "is imposter free"],
  type: "article",
});

const FAQ: { question: string; answer: string; body?: React.ReactNode }[] = [
  {
    question: "How many players do you need?",
    answer:
      "Three is the minimum and ten is the maximum. Four to seven players gives the best game. With six or more, try running two impostors.",
  },
  {
    question: "Is Imposter free?",
    answer:
      "Yes. Pass-and-play, online rooms, the standard topic packs and the leaderboard are all free with no download. Imposter+ is an optional subscription that adds extra topic packs, detailed match history and priority room creation.",
    body: (
      <p>
        Yes. Pass-and-play, online rooms, the standard topic packs and the{" "}
        <Link href="/leaderboard">leaderboard</Link> are all free with no
        download. <Link href="/pricing">Imposter+</Link> is an optional
        subscription that adds extra topic packs, detailed match history and
        priority room creation.
      </p>
    ),
  },
  {
    question: "Do I need an account?",
    answer:
      "Not for pass-and-play on a single device. For online rooms you need a lightweight account (or a guest session) so the game can keep your seat and sync state across devices. Guest sessions don't require an email.",
  },
  {
    question: "How is it different from Spyfall?",
    answer:
      "Spyfall is about locations and asking each other questions to expose the spy. Imposter is about a single secret word and one-word clues given around the table. Imposter rounds are shorter and need less setup, and it works well asynchronously in an online room.",
    body: (
      <p>
        Spyfall is about locations and asking each other pointed questions to
        expose the spy. Imposter is about a single secret <em>word</em> and
        one-word clues given around the table. Imposter rounds are shorter and
        need less setup. See{" "}
        <Link href="/games-like-spyfall">games like Spyfall</Link> for a fuller
        comparison.
      </p>
    ),
  },
  {
    question: "How is it different from The Chameleon or Chameleon-style games?",
    answer:
      "The core idea — one player doesn't know the secret and has to blend in with clues — is the same family. Imposter differs in the details: a loose theme hint for the impostor rather than nothing, adjustable clue styles, discussion and voting timers, optional two-impostor mode, and online cross-device play with a persistent leaderboard.",
  },
  {
    question: "Can the impostor win?",
    answer:
      "Yes, and good impostors win often. The impostor wins if the crew votes out an innocent player, if the top vote is tied, or if no player gets a clear majority. They don't need to stay hidden forever — just survive one vote.",
  },
  {
    question: "What does the impostor actually see?",
    answer:
      "The impostor sees the topic pack name and a faint theme hint — for example the pack 'Movies' with the hint 'romance' when the secret word is Titanic. The hint points in a direction without giving the word away. Everyone else sees the exact word.",
  },
  {
    question: "How long does a round take?",
    answer:
      "About five to ten minutes: a quick clue round, a discussion phase (60 seconds by default, adjustable), and a vote (30 seconds by default). Most groups play several rounds back to back.",
  },
  {
    question: "How do online rooms work?",
    answer:
      "One player creates a room and gets a four-letter code. Everyone else enters that code to join from their own phone or laptop. Roles, clues, votes and results sync live for every player. Public rooms also appear in a browsable list; private rooms are code-only.",
    body: (
      <p>
        One player creates a room and gets a four-letter code. Everyone else
        enters that code to join from their own device. Roles, clues, votes and
        results sync live. Public rooms appear in the{" "}
        <Link href="/rooms">rooms list</Link>; private rooms are code-only.
      </p>
    ),
  },
  {
    question: "Can I play with bots?",
    answer:
      "Yes. Online rooms can be filled with practice bots so you can learn the flow or play with a small group. Bots are clearly labelled and don't count toward the leaderboard.",
  },
  {
    question: "Is it suitable for kids or classrooms?",
    answer:
      "Yes. The standard packs (animals, food, places, household items and so on) are all family-friendly, and the game teaches turn-taking, describing things precisely and reasoning about what other people know. Pass-and-play needs only one device for the whole group.",
  },
  {
    question: "Which devices does it work on?",
    answer:
      "Any modern browser — phone, tablet, laptop or desktop. There's no app to install and nothing to download.",
  },
  {
    question: "How do I report a bug or suggest a topic pack?",
    answer:
      "Use the contact page. Bug reports and pack ideas are both welcome.",
    body: (
      <p>
        Use the <Link href="/contact">contact page</Link>. Bug reports and pack
        ideas are both welcome.
      </p>
    ),
  },
];

export default function FaqPage() {
  return (
    <ContentPage
      title="Frequently asked questions"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/faq", label: "FAQ" },
      ]}
      intro="Everything people usually ask before their first game. Still stuck? The contact page is below."
      lastUpdated="September 2026"
    >
      <JsonLd data={[
        faqLd(FAQ.map(({ question, answer }) => ({ question, answer }))),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ]),
      ]} />

      <dl>
        {FAQ.map((item) => (
          <div key={item.question} className="border-b border-border py-6">
            <dt className="text-lg font-bold text-foreground">{item.question}</dt>
            <dd className="mt-2 text-muted [&_a]:text-brand-2 [&_a:hover]:text-brand [&_a]:underline [&_a]:underline-offset-2">
              {item.body ?? <p>{item.answer}</p>}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-8">
        Ready to play? <Link href="/local/setup">Start a game</Link> or read the{" "}
        <Link href="/how-to-play">full rules</Link>.
      </p>
    </ContentPage>
  );
}
