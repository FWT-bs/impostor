import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/layout/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "A short, honest list of what we store in your browser.",
};

const COOKIE_TABLE = [
  {
    name: "Supabase session cookies",
    purpose: "Keeps you signed in between visits and identifies your guest session.",
    duration: "Up to 1 year, or until you sign out",
    essential: true,
  },
  {
    name: "impostor-cookie-consent",
    purpose: "Remembers that you've seen (and responded to) the cookie notice.",
    duration: "Until cleared",
    essential: true,
  },
  {
    name: "impostor-theme",
    purpose: "Remembers your light or dark mode preference.",
    duration: "Until cleared",
    essential: false,
  },
  {
    name: "impostor-utm",
    purpose: "Stores which link first brought you to the site, for our own first-touch attribution.",
    duration: "Until cleared",
    essential: false,
  },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie policy"
      description="A short, honest list of what we store in your browser."
      lastUpdated="August 19, 2026"
    >
      <LegalSection heading="1. The short version">
        <p>
          Impostor uses a small number of cookies and local storage entries. We don&apos;t run ad networks, and
          nothing here is sold or shared with advertisers.
        </p>
      </LegalSection>

      <LegalSection heading="2. What's stored">
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted-2">
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Purpose</th>
                <th className="px-4 py-3 font-bold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {COOKIE_TABLE.map((row) => (
                <tr key={row.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 align-top font-semibold text-foreground">
                    {row.name}
                    <span className="mt-1 block text-xs font-normal text-muted-2">
                      {row.essential ? "Essential" : "Preference"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-muted">{row.purpose}</td>
                  <td className="px-4 py-3 align-top text-muted">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection heading="3. Your choices">
        <p>
          Essential cookies (session and consent) are required for the game to function and can&apos;t be turned off
          while still using an account. Preference storage (theme and attribution) can be cleared anytime from your
          browser&apos;s settings without affecting your ability to play.
        </p>
        <p>
          The banner shown on your first visit lets you accept or decline non-essential storage. Declining still lets
          you sign in and play; it just means your theme choice won&apos;t be remembered between visits.
        </p>
      </LegalSection>

      <LegalSection heading="4. Changes">
        <p>If this list changes, we&apos;ll update the date at the top of this page.</p>
      </LegalSection>
    </LegalLayout>
  );
}
