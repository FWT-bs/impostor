/**
 * Canonical site identity — used by metadata, the sitemap, robots, and
 * structured data. Override the origin per-environment with
 * `NEXT_PUBLIC_SITE_URL` (no trailing slash).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://imposterlive.com"
).replace(/\/$/, "");

export const SITE_NAME = "Imposter";

export const SITE_TAGLINE = "The secret-word bluffing party game";

export const SITE_DESCRIPTION =
  "Imposter is a free social-deduction party game. Everyone at the table shares a secret word — except one player. Give one-word clues, spot the bluffer, and vote them out. Play pass-and-play on one phone or online with a room code, 3–10 players.";

/** Support / contact address shown on the Contact and Privacy pages. */
export const SITE_CONTACT_EMAIL = "almostfelixwu@gmail.com";

/** Absolute URL helper for canonical links and structured data. */
export function absoluteUrl(path = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path}`;
}

/** Footer / sitemap navigation, grouped. Kept here so every surface agrees. */
export const FOOTER_NAV: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Play",
    links: [
      { href: "/local/setup", label: "Pass-and-play" },
      { href: "/rooms", label: "Online rooms" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/pricing", label: "Imposter+" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { href: "/how-to-play", label: "How to play" },
      { href: "/strategy", label: "Strategy guide" },
      { href: "/packs", label: "Topic packs" },
      { href: "/games-like-spyfall", label: "Games like Spyfall" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/about", label: "About Imposter" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];
