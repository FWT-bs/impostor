import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { Icon } from "@/components/ui/Icon";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { getPacks, packWordCount } from "@/lib/content/packs";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Imposter Topic Packs — Every Word List",
  description:
    "Browse every Imposter topic pack: animals, food, sports, movies, places, technology and more. Full word lists, sub-themes and pack-specific clue tips for the crew and the impostor.",
  path: "/packs",
  keywords: [
    "imposter topic packs",
    "imposter word list",
    "party game word list",
    "secret word game categories",
  ],
});

export default function PacksIndexPage() {
  const packs = getPacks();
  const free = packs.filter((p) => !p.premium);
  const premium = packs.filter((p) => p.premium);
  const wordCount = packWordCount();

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Imposter topic packs",
    numberOfItems: packs.length,
    itemListElement: packs.map((pack, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${pack.name} pack`,
      url: absoluteUrl(`/packs/${pack.slug}`),
    })),
  };

  return (
    <ContentPage
      title="Topic packs"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/packs", label: "Topic packs" },
      ]}
      intro={`Every round of Imposter draws its secret word from a topic pack. There are ${packs.length} packs holding ${wordCount} hand-picked words. The crew sees the exact word; the impostor sees only the pack name and a faint sub-theme hint.`}
      wide
      lastUpdated="September 2026"
    >
      <JsonLd data={[listLd, breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Topic packs", path: "/packs" },
      ])]} />

      <p>
        Each pack page below has the full word list, the sub-themes inside it, a
        worked example round, and specific advice for giving clues and for
        bluffing. New to the game? Read <Link href="/how-to-play">how to play</Link>{" "}
        first.
      </p>

      <h2>Standard packs</h2>
      <p>Free for everyone, in pass-and-play and online.</p>
      <div className="not-prose mt-5 grid gap-3 sm:grid-cols-2">
        {free.map((pack) => (
          <PackCard key={pack.slug} pack={pack} />
        ))}
      </div>

      <h2>Imposter+ packs</h2>
      <p>
        Included with an <Link href="/pricing">Imposter+</Link> subscription. The
        word lists are public — you just need Imposter+ to select them in a game.
      </p>
      <div className="not-prose mt-5 grid gap-3 sm:grid-cols-2">
        {premium.map((pack) => (
          <PackCard key={pack.slug} pack={pack} premium />
        ))}
      </div>
    </ContentPage>
  );
}

function PackCard({
  pack,
  premium = false,
}: {
  pack: ReturnType<typeof getPacks>[number];
  premium?: boolean;
}) {
  return (
    <Link
      href={`/packs/${pack.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand/40 hover:bg-card-hover"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">{pack.name}</h3>
          {premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-heat/12 px-2 py-0.5 text-[11px] font-bold text-heat-2">
              <Icon name="crown" size={11} />
              Imposter+
            </span>
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-muted">
          {pack.intro}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between text-[13px] text-muted-2">
        <span>{pack.words.length} words</span>
        <span className="flex items-center gap-1 font-semibold text-brand transition-[gap] group-hover:gap-2">
          Open pack <Icon name="arrow" size={13} />
        </span>
      </div>
    </Link>
  );
}
