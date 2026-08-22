import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/layout/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The ground rules for playing Impostor.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of service"
      description="The ground rules for playing Impostor."
      lastUpdated="August 19, 2026"
    >
      <LegalSection heading="1. Agreement">
        <p>
          These terms cover your use of Impostor (&ldquo;the game,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;),
          including local pass-and-play, online rooms, the leaderboard, and any premium features. By creating an
          account, playing as a guest, or otherwise using the game, you agree to these terms.
        </p>
        <p>
          This is an indie project, not a law firm&apos;s handiwork. If something here is unclear, reach out on the{" "}
          <a href="/contact" className="font-semibold text-foreground underline underline-offset-2">
            contact page
          </a>{" "}
          and we&apos;ll sort it out.
        </p>
      </LegalSection>

      <LegalSection heading="2. Accounts and guest play">
        <p>
          You can play as a guest without an account, or create a full account with an email and password. You&apos;re
          responsible for keeping your login credentials to yourself and for anything that happens under your account.
          Guest sessions are temporary and their stats and history can be lost if the guest session ends.
        </p>
        <p>You must be old enough to consent to online data processing under the laws where you live to create an account.</p>
      </LegalSection>

      <LegalSection heading="3. Acceptable use">
        <p>Playing fair keeps the game fun for everyone. While using Impostor, don&apos;t:</p>
        <p>
          Use bots or automation to manipulate the leaderboard or matchmaking; harass, threaten, or impersonate other
          players in chat or usernames; attempt to access another player&apos;s account or private role information;
          probe, scan, or interfere with the service&apos;s security; or use the game to violate any applicable law.
        </p>
        <p>
          We can suspend or remove accounts, rooms, or content that break these rules, at our discretion and without
          advance notice for serious cases.
        </p>
      </LegalSection>

      <LegalSection heading="4. Premium subscriptions">
        <p>
          Premium unlocks additional topic packs and cosmetic perks. Payments are processed by Stripe; we never see or
          store your full card number. Subscriptions renew automatically until canceled from your account settings or
          the billing portal. Refunds are handled case by case, so contact us if something went wrong with a charge.
        </p>
      </LegalSection>

      <LegalSection heading="5. Content you submit">
        <p>
          Usernames, avatar images, clues, and chat messages you post are yours, but you grant us a license to store
          and display them within the game so other players in your room or on the leaderboard can see them. Don&apos;t
          upload avatar images or usernames that are illegal, hateful, or infringe someone else&apos;s rights. We can
          remove content that crosses those lines.
        </p>
      </LegalSection>

      <LegalSection heading="6. Service availability">
        <p>
          Impostor is provided &ldquo;as is.&rdquo; Rooms expire automatically after periods of inactivity, and we
          don&apos;t guarantee uninterrupted uptime, that the service will be error-free, or that your stats and match
          history will be preserved indefinitely. Back up anything you care about outside the game.
        </p>
      </LegalSection>

      <LegalSection heading="7. Limitation of liability">
        <p>
          To the extent allowed by law, Impostor and its operators aren&apos;t liable for indirect, incidental, or
          consequential damages arising from your use of the game. Our total liability for any claim is limited to the
          amount you paid us in the twelve months before the claim, if any.
        </p>
      </LegalSection>

      <LegalSection heading="8. Changes to these terms">
        <p>
          We may update these terms as the game evolves. We&apos;ll update the date at the top of this page when we do.
          Continuing to use Impostor after a change means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="9. Contact">
        <p>
          Questions about these terms? Use the{" "}
          <a href="/contact" className="font-semibold text-foreground underline underline-offset-2">
            contact page
          </a>{" "}
          and pick &ldquo;Support&rdquo; as the category.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
