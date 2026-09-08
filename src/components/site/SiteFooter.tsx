import Link from "next/link";
import { FOOTER_NAV, SITE_NAME } from "@/lib/site";

/**
 * Site-wide footer. Server component — it's the same for every visitor and
 * carries the internal links (guides, packs, policy pages) that both readers
 * and crawlers use to reach the rest of the site.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div>
            <Link
              href="/"
              className="display text-2xl tracking-tight text-foreground transition-colors hover:text-brand"
            >
              {SITE_NAME}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              A free secret-word party game for 3–10 players. One phone or online,
              no download.
            </p>
          </div>

          {FOOTER_NAV.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-2">
                {group.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {SITE_NAME}. Independent game, not affiliated with any other
            party game.
          </span>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
