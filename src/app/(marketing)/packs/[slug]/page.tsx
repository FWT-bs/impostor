import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/site/ContentPage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { getPack, getPacks } from "@/lib/content/packs";

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
  // Only free packs deep-link a pre-selected pack into setup; premium packs
  // send players to the plain setup screen (selecting one needs Imposter+).
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

      <div className="not-prose mb-8 flex flex-wrap items-center gap-3">
        {pack.premium ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-heat/12 px-3 py-1 text-[12px] font-bold text-heat-2">
            <Icon name="crown" size={12} />
            Imposter+ pack
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/12 px-3 py-1 text-[12px] font-bold text-brand-2">
            <Icon name="check" size={12} />
            Free pack
          </span>
        )}
        <span className="text-[13px] text-muted-2">
          {pack.words.length} words · {pack.themes.length} sub-themes
        </span>
      </div>

      <h2>The word list</h2>
      <p>
        These are every word in the {pack.name} pack. In a game the crew sees one
        of them exactly; the impostor sees only the sub-theme in the right-hand
        column.
      </p>
      <div className="not-prose mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-2">
              <th className="py-2 pr-4 font-semibold">Word</th>
              <th className="py-2 font-semibold">Impostor sees</th>
            </tr>
          </thead>
          <tbody>
            {pack.words.map((w) => (
              <tr key={w.word} className="border-b border-border/60">
                <td className="py-2 pr-4 font-semibold text-foreground">
                  {w.word}
                </td>
                <td className="py-2 text-muted">{w.topic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Giving clues for this pack</h2>
      <h3>If you&apos;re on the crew</h3>
      <p>{pack.crewTip}</p>
      <h3>If you&apos;re the impostor</h3>
      <p>{pack.impostorTip}</p>

      {sample.word && (
        <>
          <h2>A sample round</h2>
          <div className="article-card not-prose">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-2">
              Secret word
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {sample.word}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-semibold text-brand-2">
                  Crew clues
                </p>
                <ul className="mt-1.5 space-y-1 text-sm text-muted">
                  {sample.crewClues.map((clue) => (
                    <li key={clue}>&ldquo;{clue}&rdquo;</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-heat-2">
                  Impostor&apos;s clue
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  &ldquo;{sample.impostorClue}&rdquo;
                </p>
              </div>
            </div>
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted">
              <strong className="text-foreground">The tell:</strong>{" "}
              {sample.tell}
            </p>
          </div>
        </>
      )}

      <h2>Play the {pack.name} pack</h2>
      <p>
        {pack.premium ? (
          <>
            Pick <strong>{pack.name}</strong> on the setup screen — it needs an{" "}
            <Link href="/pricing">Imposter+</Link> subscription. Or leave the pack
            on Random and the vault will still deal from it sometimes.
          </>
        ) : (
          <>
            Choose <strong>{pack.name}</strong> when you set up a{" "}
            <Link href={startHref}>pass-and-play game</Link> or when you{" "}
            <Link href="/rooms">create an online room</Link>.
          </>
        )}
      </p>
      <div className="not-prose mt-5 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={startHref}>Start a game</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/packs">All packs</Link>
        </Button>
      </div>

      {related.length > 0 && (
        <>
          <h2>Related packs</h2>
          <ul>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/packs/${r.slug}`}>{r.name}</Link> —{" "}
                {r.intro.split(".")[0]}.
              </li>
            ))}
          </ul>
        </>
      )}
    </ContentPage>
  );
}
