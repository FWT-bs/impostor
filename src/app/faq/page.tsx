"use client";

import { AppShell, PageHeader } from "@/components/game";
import { Accordion, type AccordionItemData } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { getAuthAvatarColor, getAuthAvatarUrl, getAuthDisplayName } from "@/lib/auth-display-name";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";

const GAME_FAQ: AccordionItemData[] = [
  {
    question: "How many players do I need?",
    answer: "Three at minimum, up to ten in a room. One or two players are secretly the impostor, and everyone else shares a secret word they have to describe without saying it outright.",
  },
  {
    question: "What's the difference between local and online play?",
    answer: "Local play is pass-and-play on a single device, good for being in the same room together. Online rooms let each player join from their own phone or laptop, anywhere.",
  },
  {
    question: "How does a bot fill an empty seat?",
    answer: "The host can add a bot to any open seat in an online lobby. Bots play a full round, including giving clues and voting, so you're never stuck waiting for one more human.",
  },
  {
    question: "What happens if I lose connection mid-round?",
    answer: "Rejoin the room with the same link or code and your seat, role, and progress are still there as long as the room hasn't expired.",
  },
  {
    question: "How long do rooms stay open?",
    answer: "Idle rooms are cleaned up automatically after a period of inactivity so codes don't pile up. Once a match is underway, it stays open as you play.",
  },
];

const ACCOUNT_FAQ: AccordionItemData[] = [
  {
    question: "Do I need an account to play?",
    answer: "No. Guest play works for both local and online games. Creating a full account keeps your stats, avatar, and premium purchases attached to you across devices.",
  },
  {
    question: "How do I change my username or avatar?",
    answer: "Open your profile page, hit \"Edit profile,\" and update your username, avatar color, photo, bio, or pronouns from there.",
  },
  {
    question: "What does Premium include?",
    answer: "Premium unlocks 40+ exclusive topic packs, priority room creation, detailed match history, and a badge on your profile. See the pricing page for the full list.",
  },
  {
    question: "How do I cancel Premium?",
    answer: "Manage or cancel your subscription anytime from the billing portal linked on your profile page. Cancellation takes effect at the end of the current billing period.",
  },
  {
    question: "How do I delete my account or data?",
    answer: "Send a request from the contact page and we'll take care of it. See the privacy policy for what gets removed and what's retained.",
  },
];

export default function FaqPage() {
  const { user, profile } = useAuth();
  const userSlot = user
    ? {
        username: getAuthDisplayName(user, profile),
        avatarColor: getAuthAvatarColor(user, profile),
        avatarUrl: getAuthAvatarUrl(user, profile),
      }
    : null;

  return (
    <AppShell user={userSlot} mainClassName="max-w-3xl">
      <PageHeader title="Frequently asked questions" description="Everything we get asked most often, in one place." />

      <div className="flex flex-col gap-10">
        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-2">Playing the game</h2>
          <Accordion items={GAME_FAQ} />
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-2">Accounts and premium</h2>
          <Accordion items={ACCOUNT_FAQ} />
        </div>

        <div className="flex flex-col items-center gap-4 rounded-[28px] bg-card p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Still stuck?</h2>
          <p className="max-w-sm text-sm text-muted">
            Send us a message and we&apos;ll get back to you at the email you leave.
          </p>
          <Button variant="primary" asChild>
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
