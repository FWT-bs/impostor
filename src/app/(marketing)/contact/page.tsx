import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { SITE_CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Contact Imposter",
  description:
    "Get in touch with Imposter — bug reports, topic pack suggestions, billing questions, privacy requests and press enquiries.",
  path: "/contact",
});

const REASONS: { heading: string; text: React.ReactNode }[] = [
  {
    heading: "Bugs and problems",
    text: "Something broke mid-game, a room won't load, a score looks wrong. Tell us what device and browser you were on and what you were doing — screenshots help.",
  },
  {
    heading: "Topic pack ideas",
    text: "Got a theme the game should have? Send the pack name and a handful of example words.",
  },
  {
    heading: "Billing and Imposter+",
    text: (
      <>
        Questions about a subscription, a charge, or cancelling. You can also
        manage or cancel Imposter+ yourself from your{" "}
        <Link href="/profile">profile</Link>.
      </>
    ),
  },
  {
    heading: "Privacy requests",
    text: (
      <>
        To ask what data is held about your account, or to have it deleted, email
        us from the address on the account. See the{" "}
        <Link href="/privacy">privacy policy</Link> for what we store.
      </>
    ),
  },
  {
    heading: "Press and everything else",
    text: "Writing about the game, or just have a question that doesn't fit the boxes above — that's fine, get in touch.",
  },
];

export default function ContactPage() {
  return (
    <ContentPage
      title="Contact"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/contact", label: "Contact" },
      ]}
      intro="Imposter is run by one person. The fastest way to reach them is email — most messages get a reply within a few days."
    >
      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
      ])} />

      <div className="article-card article-card--accent">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-2">
          Email
        </p>
        <a
          href={`mailto:${SITE_CONTACT_EMAIL}`}
          className="mt-1 block text-xl font-bold text-brand-2 underline underline-offset-4 hover:text-brand"
        >
          {SITE_CONTACT_EMAIL}
        </a>
      </div>

      <h2>What to include</h2>
      <p>
        Pick whichever fits — it just helps route your message faster.
      </p>
      <dl>
        {REASONS.map((reason) => (
          <div key={reason.heading} className="border-b border-border py-5">
            <dt className="font-bold text-foreground">{reason.heading}</dt>
            <dd className="mt-1.5 text-muted">{reason.text}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-8">
        Looking for answers first? The <Link href="/faq">FAQ</Link> covers most
        questions, and <Link href="/how-to-play">how to play</Link> has the full
        rules.
      </p>
    </ContentPage>
  );
}
