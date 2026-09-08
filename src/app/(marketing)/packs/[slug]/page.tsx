import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/site/ContentPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PACK_TILE_TONE, getPack, getPacks } from "@/lib/content/packs";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getPacks().map((pack) => ({ slug: pack.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pack = getPack(slug);
  if (!pack) return {};
  return pageMetadata({
    title: `${pack.name} Pack — Imposter Words & Clue Tips`,
    description: `The ${pack.name} topic pack for Imposter: all ${pack.words.length} words, its sub-themes, a worked example round, and clue advice for the crew and the impostor.`,
    path: `/packs/${pack.slug}`,
    keywords: [
      `imposter ${pack.name.toLowerCase()} pack`,
      `${pack.name.toLowerCase()} word list`,
      "imposter game words",
      "party game clue ideas",
    ],
    type: "article",
  });
}

export default async function PackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pack = getPack(slug);
  if (!pack) notFound();

  const related = getPacks()
    .filter((p) => p.slug !== pack.slug && p.premium === pack.premium)
    .slice(0, 3);

  const sample = pack.sampleRound;
  const startHref = pack.premium
    ? "/local/setup"
    : `/local/setup?pack=${pack.slug}`;

  return (
    <ContentPage
      title={`The ${pack.name} pack`}
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/packs", label: "Topic packs" },
        { href: `/packs/${pack.slug}`, label: pack.name },
      ]}
      intro={pack.intro}
      wide
      lastUpdated="September 2026"
    >
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Topic packs", path: "/packs" },
          { name: pack.name, path: `/packs/${pack.slug}` },
        ])}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl",
            PACK_TILE_TONE[pack.tone],
          )}
        >
          <Icon name={pack.icon} size={18} />
        </span>
        <Badge variant={pack.premium ? "pink" : "default"}>
          <Icon name={pack.premium ? "crown" : "check"} size={12} />
          {pack.premium ? "Imposter+ pack" : "Free pack"}
        </Badge>
        <Badge variant="secondary">{pack.words.length} words</Badge>
        <Badge variant="secondary">{pack.themes.length} sub-themes</Badge>
      </div>

      <h2>The word list</h2>
      <p>
        The crew sees one of these exactly. The impostor sees only the sub-theme
        under it.
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {pack.words.map((w) => (
          <div key={w.word} className="rounded-2xl bg-card p-3.5">
            <p className="font-bold leading-tight text-foreground">{w.word}</p>
            <p className="mt-1 text-[12px] leading-snug text-muted-2">{w.topic}</p>
          </div>
        ))}
      </div>

      <h2>Clue tips</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] bg-card p-5">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand/14 text-brand-2">
              <Icon name="shield" size={16} />
            </span>
            <h3 className="text-[15px] font-bold text-foreground">
              Playing crew
            </h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {pack.crewTip}
          </p>
        </div>
        <div className="rounded-[22px] bg-card p-5">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-heat/14 text-heat-2">
              <Icon name="mask" size={16} />
            </span>
            <h3 className="text-[15px] font-bold text-foreground">
              Playing impostor
            </h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {pack.impostorTip}
          </p>
        </div>
      </div>

      {sample.word && (
        <>
          <h2>A sample round</h2>
          <div className="article-card">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-2">
              Secret word
            </p>
            <p className="display mt-1 text-2xl text-foreground">{sample.word}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-bold text-brand-2">Crew clues</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sample.crewClues.map((clue) => (
                    <span
                      key={clue}
                      className="rounded-full bg-brand/12 px-2.5 py-1 text-[13px] font-semibold text-brand-2"
                    >
                      {clue}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[13px] font-bold text-heat-2">
                  Impostor&apos;s clue
                </p>
                <div className="mt-2">
                  <span className="rounded-full bg-heat/12 px-2.5 py-1 text-[13px] font-semibold text-heat-2">
                    {sample.impostorClue}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-muted">
              <strong className="text-foreground">The tell —</strong> {sample.tell}
            </p>
          </div>
        </>
      )}

      <h2>Play this pack</h2>
      <div className="article-card--accent article-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted">
          {pack.premium ? (
            <>
              Pick <strong className="text-foreground">{pack.name}</strong> on the
              setup screen — it needs <Link href="/pricing">Imposter+</Link>.
            </>
          ) : (
            <>
              Choose <strong className="text-foreground">{pack.name}</strong> in
              pass-and-play or when you{" "}
              <Link href="/rooms">create an online room</Link>.
            </>
          )}
        </p>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Button asChild>
            <Link href={startHref}>Start a game</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/packs">All packs</Link>
          </Button>
        </div>
      </div>

      {related.length > 0 && (
        <>
          <h2>Related packs</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/packs/${r.slug}`}
                className="group flex items-center justify-between rounded-2xl bg-card p-4 transition-colors hover:bg-card-hover"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-lg",
                      PACK_TILE_TONE[r.tone],
                    )}
                  >
                    <Icon name={r.icon} size={15} />
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {r.name}
                  </span>
                </span>
                <Icon
                  name="arrow"
                  size={15}
                  className="text-muted-2 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        </>
      )}
    </ContentPage>
  );
}
