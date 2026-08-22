import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

const playLinks = [
  { href: "/local/setup", label: "Play local" },
  { href: "/rooms", label: "Online rooms" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/pricing", label: "Premium" },
] as const;

const helpLinks = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

const legalLinks = [
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/cookies", label: "Cookie policy" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="print:hidden border-t border-border" style={{ background: "var(--surface)" }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo size={26} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            A social deduction party game for the group chat. Gather your crew, hide the impostor, and see who talks their way out.
          </p>
        </div>

        <FooterColumn title="Play" links={playLinks} />
        <FooterColumn title="Help" links={helpLinks} />
        <FooterColumn title="Legal" links={legalLinks} />
      </div>

      <div className="border-t border-border px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {year} Impostor. All rights reserved.</p>
          <p>Made for game night.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-2">{title}</p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
