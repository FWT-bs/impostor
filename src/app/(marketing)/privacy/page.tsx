import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { JsonLd, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { SITE_CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Imposter collects, uses and protects your data: accounts, gameplay, cookies, third-party advertising (Google AdSense), payments (Stripe) and your rights.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy policy"
      breadcrumbs={[
        { href: "/", label: "Home" },
        { href: "/privacy", label: "Privacy" },
      ]}
      intro={`This policy explains what ${SITE_NAME} collects, why, and what choices you have. It's written to be read, not to be impenetrable — if anything is unclear, email us.`}
      lastUpdated="September 2026"
    >
      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Privacy", path: "/privacy" },
      ])} />

      <h2>The short version</h2>
      <ul>
        <li>You can play pass-and-play with no account and no personal data.</li>
        <li>
          Online play needs a lightweight account or guest session so we can keep
          your seat and sync the game. Guests don&apos;t need an email.
        </li>
        <li>
          We use cookies for sign-in. Third-party partners — including Google —
          use cookies to show ads on the informational pages.
        </li>
        <li>Payments are handled by Stripe. We never see your card number.</li>
        <li>
          You can ask for a copy of your data or its deletion at any time:{" "}
          <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>.
        </li>
      </ul>

      <h2>Who we are</h2>
      <p>
        {SITE_NAME} is an independent game operated by a single developer. For any
        privacy question or request, contact{" "}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>. This is
        the data controller for the purposes of the UK GDPR and EU GDPR.
      </p>

      <h2>What we collect</h2>

      <h3>If you only play pass-and-play</h3>
      <p>
        Nothing that identifies you. The player names you type stay on your
        device for the length of the session. We may store a small preference in
        your browser (for example, that you&apos;ve seen the intro animation and
        your chosen display name).
      </p>

      <h3>If you create an account or play online as a guest</h3>
      <ul>
        <li>
          <strong>Account details</strong> — an email address and password if you
          register a full account; for guest sessions, just an anonymous
          identifier. Authentication is handled by Supabase.
        </li>
        <li>
          <strong>Profile</strong> — your display name and avatar colour.
        </li>
        <li>
          <strong>Gameplay data</strong> — the rooms you join, clues and votes
          during a round, and your lifetime stats (games played, wins as crew,
          wins as impostor). These power the{" "}
          <Link href="/leaderboard">leaderboard</Link> and your match history.
        </li>
        <li>
          <strong>Technical data</strong> — standard server logs (IP address,
          browser type, timestamps) kept briefly for security and debugging.
        </li>
      </ul>

      <h3>If you subscribe to Imposter+</h3>
      <p>
        Payment is processed by <strong>Stripe</strong>. Stripe collects your
        card details directly; we receive only a customer reference, your
        subscription status, and the country and card brand for tax and support.
        We never store full card numbers. Stripe&apos;s handling of your data is
        covered by{" "}
        <a
          href="https://stripe.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Stripe&apos;s privacy policy
        </a>
        .
      </p>

      <h2>Cookies and local storage</h2>
      <p>We use browser storage for three things:</p>
      <ul>
        <li>
          <strong>Essential</strong> — a session cookie that keeps you signed in
          during online play. The game does not work without it.
        </li>
        <li>
          <strong>Preferences</strong> — small values like your saved display
          name and whether you&apos;ve seen the intro, stored locally in your
          browser.
        </li>
        <li>
          <strong>Advertising</strong> — set by Google and its partners on the
          informational pages (see below).
        </li>
      </ul>
      <p>
        We do not currently use a separate analytics or tracking product.
      </p>

      <h2>Advertising</h2>
      <p>
        The informational pages of this site (guides, topic packs, this policy)
        may display ads served through <strong>Google AdSense</strong>. Ads are
        not shown on the live game screens.
      </p>
      <ul>
        <li>
          Third-party vendors, including Google, use cookies to serve ads based
          on your prior visits to this and other websites.
        </li>
        <li>
          Google&apos;s use of advertising cookies enables it and its partners to
          serve ads to you based on your visit to this site and/or other sites on
          the internet.
        </li>
        <li>
          You can opt out of personalised advertising by visiting{" "}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Ads Settings
          </a>
          . You can also opt out of a third-party vendor&apos;s use of cookies
          for personalised advertising at{" "}
          <a
            href="https://www.aboutads.info"
            target="_blank"
            rel="noopener noreferrer"
          >
            aboutads.info
          </a>
          .
        </li>
        <li>
          For more on how Google uses data from sites that use its services, see{" "}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google&apos;s partner-sites policy
          </a>
          .
        </li>
      </ul>
      <p>
        Where required by law, ads will only be personalised after you consent
        through the cookie notice shown on your first visit from an applicable
        region.
      </p>

      <h2>How we use your data</h2>
      <ul>
        <li>To run the game — assign roles, sync rooms, record results.</li>
        <li>To show your stats and the leaderboard.</li>
        <li>To process and support Imposter+ subscriptions.</li>
        <li>To keep the service secure and diagnose problems.</li>
        <li>To fund the free game through advertising on informational pages.</li>
      </ul>
      <p>
        The legal bases we rely on are performance of a contract (running an
        account you asked for), legitimate interests (security, keeping the free
        game viable) and consent (advertising cookies where required).
      </p>

      <h2>Sharing</h2>
      <p>
        We don&apos;t sell your data. We share it only with the service providers
        that make the game work:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — database, authentication and realtime sync.
        </li>
        <li>
          <strong>Vercel</strong> — hosting and content delivery.
        </li>
        <li>
          <strong>Stripe</strong> — subscription payments.
        </li>
        <li>
          <strong>Google</strong> — advertising on informational pages.
        </li>
      </ul>

      <h2>Retention</h2>
      <p>
        Account and profile data is kept while your account exists. Finished game
        rooms and their round data are cleared automatically not long after the
        game ends; your aggregate stats persist on your profile. Server logs are
        rotated within a short period. If you delete your account, we remove your
        profile and personal data, keeping only what we must for legal or
        accounting reasons (for example, a record that a payment occurred).
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you can ask us to give you a copy of your
        data, correct it, delete it, or restrict how we use it, and you can
        withdraw consent for advertising cookies at any time. Email{" "}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a> from the
        address on your account and we&apos;ll action it. You also have the right
        to complain to your local data-protection authority.
      </p>

      <h2>Children</h2>
      <p>
        The game is family-friendly, but accounts are not intended for children
        under 13 (or the minimum age in your country). We don&apos;t knowingly
        collect data from children under that age. If you believe a child has
        created an account, contact us and we&apos;ll remove it.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially, we&apos;ll update the date at the top
        and, for significant changes, note it in the app. Continuing to use{" "}
        {SITE_NAME} after a change means you accept the updated policy.
      </p>
    </ContentPage>
  );
}
