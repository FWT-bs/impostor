import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { Icon } from "@/components/ui/Icon";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  PACK_TILE_TONE,
  getPacks,
  packWordCount,
  type Pack,
} from "@/lib/content/packs";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Imposter Topic Packs — Every Word List",
  description:
    "Browse every Imposter topic pack: animals, food, movies, dinosaurs, pizza toppings and more. Full word lists, sub-themes and pack-specific clue tips.",
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
      intro={`Every round draws its secret word from a topic pack — ${packs.length} of them, ${wordCount} hand-picked words. The crew sees the exact word; the impostor only sees the pack.`}
      wide
      lastUpdated="September 2026"
    >
      <JsonLd data={[listLd, breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Topic packs", path: "/packs" },
      ])]} />

      <PackSection
        heading="Standard packs"
        note="Free for everyone, in pass-and-play and online."
        count={free.length}
        packs={free}
      />
      <PackSection
        heading="Imposter+ packs"
        note="Unlocked with an Imposter+ subscription — word lists are public."
        count={premium.length}
        packs={premium}
        premium
      />
    </ContentPage>
  );
}

function PackSection({
  heading,
  note,
  count,
  packs,
  premium = false,
}: {
  heading: string;
  note: string;
  count: number;
  packs: Pack[];
  premium?: boolean;
}) {
  return (
    <section className="mt-12 first:mt-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="display text-2xl text-foreground">{heading}</h2>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-bold",
            premium ? "bg-heat/12 text-heat-2" : "bg-brand/12 text-brand-2",
          )}
        >
          {count} packs
        </span>
      </div>
      <p className="mt-1.5 text-sm text-muted">{note}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack) => (
          <PackTile key={pack.slug} pack={pack} premium={premium} />
        ))}
      </div>
    </section>
  );
}

function PackTile({ pack, premium }: { pack: Pack; premium: boolean }) {
  return (
    <Link
      href={`/packs/${pack.slug}`}
      className="group flex h-full flex-col justify-between rounded-[22px] bg-card p-5 transition-all duration-200 will-change-transform hover:-translate-y-0.5 hover:bg-card-hover active:translate-y-0 active:scale-[0.99]"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className={cn("grid size-11 place-items-center rounded-2xl", PACK_TILE_TONE[pack.tone])}>
            <Icon name={pack.icon} size={20} />
          </div>
          {premium && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-heat/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-heat-2">
              <Icon name="crown" size={10} />
              Plus
            </span>
          )}
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">{pack.name}</h3>
        <p className="mt-1 text-[12.5px] leading-snug text-muted-2">
          {pack.themes.slice(0, 3).join(" · ")}
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between text-[13px]">
        <span className="font-semibold text-muted-2">{pack.words.length} words</span>
        <span className="flex items-center gap-1 font-semibold text-brand transition-[gap] group-hover:gap-2">
          Open pack <Icon name="arrow" size={14} />
        </span>
      </div>
    </Link>
  );
}
