import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface Crumb {
  href: string;
  label: string;
}

/**
 * Shell for the readable, server-rendered pages (guides, packs, policy). Gives
 * them the app header and the shared footer, a constrained reading column, and
 * an optional breadcrumb. The body content is passed straight through so the
 * HTML that ships on first request already contains the article text.
 */
export function ContentPage({
  title,
  intro,
  breadcrumbs,
  children,
  lastUpdated,
  wide = false,
}: {
  title: string;
  intro?: ReactNode;
  breadcrumbs?: Crumb[];
  children: ReactNode;
  lastUpdated?: string;
  wide?: boolean;
}) {
  return (
    <div className="tabletop-page flex min-h-screen flex-col">
      <Header />
      <main
        className={cn(
          "mx-auto w-full flex-1 px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-10",
          wide ? "max-w-5xl" : "max-w-3xl",
        )}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-2">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden>/</span>}
                  <Link
                    href={crumb.href}
                    className="font-medium transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <header className="mb-10">
          <h1 className="display text-[clamp(2rem,5vw,3rem)] leading-[1.08] text-foreground">
            {title}
          </h1>
          {intro && (
            <div className="mt-4 text-[17px] leading-relaxed text-muted">
              {intro}
            </div>
          )}
          {lastUpdated && (
            <p className="mt-4 text-[13px] text-muted-2">Last updated {lastUpdated}</p>
          )}
        </header>

        <div className="article">{children}</div>

        <div className="mt-14 border-t border-border pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition-[gap] hover:gap-3"
          >
            <Icon name="arrow" size={16} className="rotate-180" />
            Back to Imposter
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
