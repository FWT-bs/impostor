import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { SITE_CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms for using Imposter — acceptable use, accounts, Imposter+ subscriptions and billing, disclaimers and contact.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of service"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/terms", label: "Terms" },
      ]}
      intro={`By using ${SITE_NAME} you agree to these terms. They're deliberately short.`}
      lastUpdated="September 2026"
    >
      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Terms", path: "/terms" },
      ])} />

      <h2>1. The service</h2>
      <p>
        {SITE_NAME} is a browser-based party game provided free of charge, with an
        optional paid subscription (&ldquo;Imposter+&rdquo;). We may change,
        suspend or discontinue any part of it at any time. We aim to keep it
        available and working but don&apos;t guarantee uninterrupted service.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>
          You&apos;re responsible for activity under your account and for keeping
          your login details secure.
        </li>
        <li>
          Provide accurate information when registering. Don&apos;t impersonate
          others or create accounts to evade a restriction.
        </li>
        <li>
          Accounts are for people aged 13 or older (or the minimum age where you
          live).
        </li>
        <li>
          You can delete your account at any time by contacting us. We can
          suspend or remove accounts that break these terms.
        </li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>When using {SITE_NAME}, don&apos;t:</p>
      <ul>
        <li>
          harass, threaten or abuse other players, or use display names, clues or
          chat messages that are hateful, obscene or designed to harm;
        </li>
        <li>
          cheat, exploit bugs, script the game, or interfere with other
          players&apos; sessions;
        </li>
        <li>
          attempt to access accounts, data or systems that aren&apos;t yours;
        </li>
        <li>
          scrape, resell or redistribute the game&apos;s content, or use it to
          train models, without permission;
        </li>
        <li>
          use the service for anything unlawful.
        </li>
      </ul>
      <p>
        User-entered content (names, clues, chat) is your responsibility. We may
        remove content or restrict accounts that break these rules, and we may do
        so without notice where the behaviour is serious.
      </p>

      <h2>4. Imposter+ subscriptions and billing</h2>
      <ul>
        <li>
          Imposter+ is billed as a recurring subscription through Stripe at the
          price shown on the <Link href="/pricing">pricing page</Link> at the
          time you subscribe.
        </li>
        <li>
          It renews automatically each billing period until you cancel. You can
          cancel any time from your <Link href="/profile">profile</Link> or the
          billing portal; access continues until the end of the paid period.
        </li>
        <li>
          Except where the law requires otherwise, payments are non-refundable.
          If you were charged in error, contact us.
        </li>
        <li>
          If a payment fails, we may retry it and may pause Imposter+ features
          until it succeeds.
        </li>
        <li>
          We may change subscription pricing or features with reasonable notice;
          changes take effect at your next renewal.
        </li>
      </ul>

      <h2>5. Intellectual property</h2>
      <p>
        The name, design, code, topic packs and other content of {SITE_NAME} are
        owned by its developer or used with permission. You get a personal,
        non-exclusive, non-transferable right to use the service for playing the
        game. The underlying idea of a secret-word deduction game is a common one
        and not claimed here; the specific implementation and written content are.
      </p>

      <h2>6. Disclaimers</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;, without warranties of any kind, to the fullest extent
        the law allows. We don&apos;t warrant that it will be error-free,
        secure, or continuously available, or that stats and results are free of
        bugs.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {SITE_NAME} and its developer
        will not be liable for indirect, incidental or consequential damages, or
        for loss of data, profits or goodwill, arising from your use of the
        service. Where liability can&apos;t be excluded, it is limited to the
        amount you paid us in the 12 months before the claim (which, for free
        users, is nil). Nothing in these terms limits liability that can&apos;t be
        limited by law.
      </p>

      <h2>8. Changes to these terms</h2>
      <p>
        We may update these terms. Material changes will be reflected in the date
        above and, where significant, noted in the app. Continuing to use{" "}
        {SITE_NAME} after a change means you accept the new terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>.
      </p>
    </ContentPage>
  );
}
