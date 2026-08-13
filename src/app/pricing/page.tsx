"use client";

import {
  AppShell,
  DoodleMark,
  GameCard,
  PageHeader,
  PricingCard,
  TopicPackChip,
} from "@/components/game";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { loginWithNext } from "@/lib/auth-path";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
import { useAuth } from "@/lib/hooks/use-auth";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { toast } from "sonner";

const FREE_FEATURES = [
  "Standard topic packs",
  "Local pass-and-play",
  "Online multiplayer rooms",
  "Global leaderboard",
];

const PREMIUM_FEATURES = [
  "40+ exclusive topic packs",
  "Priority room creation",
  "Detailed match history",
  "Imposter+ badge",
  "Support development",
];

const PREMIUM_PACKS = [
  "Cult Movies",
  "Street Food",
  "90s Nostalgia",
  "World Capitals",
  "Sneakerhead",
  "Boss Battles",
  "Cocktails",
  "Conspiracies",
  "K-Pop",
  "Pro Wrestling",
  "Cryptids",
  "Michelin",
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const canceled = searchParams.get("canceled") === "true";

  const isPremium = profile?.is_premium ?? false;
  const isGuest = !user || user.is_anonymous;

  async function handleUpgrade() {
    if (!user) {
      router.push(loginWithNext("/pricing"));
      return;
    }
    if (isGuest) {
      toast.error("Create a full account first to purchase premium");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout");
        return;
      }
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  async function handleManageBilling() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to open billing portal");
        return;
      }
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  const userSlot = user
    ? {
        username: getAuthDisplayName(user, profile),
        avatarColor: getAuthAvatarColor(user, profile),
      }
    : null;

  return (
    <AppShell user={userSlot} mainClassName="max-w-6xl">
      <section className="relative grid items-center gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <DoodleMark kind="lock" className="-left-4 top-12" color="var(--brand)" size={44} />
        <DoodleMark kind="mask" className="left-[42%] top-8 hidden lg:block" color="var(--text)" size={50} />
        <DoodleMark kind="shh" className="left-[34%] top-[45%] hidden lg:block" color="var(--heat)" size={50} rotate={8} />
        <div>
          <PageHeader
            eyebrow={<><Icon name="crown" size={15} /> Imposter+</>}
            title={
              <>
                Unlock the <span className="scribble-word" style={{ "--scribble-color": "var(--heat)" } as CSSProperties}>full</span> table
              </>
            }
            description="The locked topic drawer, more packs, better room priority, a badge for regulars"
            actions={
              <Button size="lg" onClick={isPremium ? handleManageBilling : handleUpgrade} isLoading={loading}>
                <Icon name="crown" size={20} /> {isPremium ? "Manage Imposter+" : "Join Imposter+"}
              </Button>
            }
          />
          <p className="ml-6 mt-2 max-w-[20ch] rotate-[-3deg] font-display text-2xl leading-tight text-brand">
            More chaos, better games
          </p>
        </div>
        <TopicVaultImage />
      </section>

      {canceled && (
        <div className="mx-auto mb-6 max-w-xl rounded-lg border border-heat/35 bg-heat/10 px-4 py-3 text-center text-sm text-heat-2">
          Checkout canceled, no charge made
        </div>
      )}

      <section className="mb-8 mt-8">
        <GameCard accent="pink" className="overflow-hidden p-5 sm:p-6">
          <div className="relative z-[1] mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="locked"><Icon name="lock" size={13} /> Locked packs</Badge>
              <h2 className="mt-3 text-3xl font-bold">The topic drawer</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Oddly specific packs, argument-friendly categories, built for bluffing
              </p>
            </div>
            <Badge variant="pink">40+ total</Badge>
          </div>
          <div className="relative z-[1] flex flex-wrap gap-2">
            {PREMIUM_PACKS.map((pack) => (
              <TopicPackChip key={pack} name={pack} locked premium />
            ))}
          </div>
        </GameCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <PricingCard
          name="Free"
          price="$0"
          description="Everything for a table tonight"
          features={FREE_FEATURES}
          badge={<Badge variant="secondary">Current base game</Badge>}
          cta={
            <Button variant="secondary" size="lg" className="w-full" disabled>
              {isPremium ? "Included" : "Current plan"}
            </Button>
          }
        />

        <PricingCard
          name="Imposter+"
          price="$3"
          description="Bigger tables, fresher packs, a little more room to bluff"
          features={PREMIUM_FEATURES}
          featured
          badge={<Badge variant={isPremium ? "live" : "pink"}>{isPremium ? "Active" : "Unlock"}</Badge>}
          cta={
            isPremium ? (
              <Button variant="secondary" size="lg" className="w-full" onClick={handleManageBilling} isLoading={loading}>
                Manage billing
              </Button>
            ) : (
              <Button size="lg" className="w-full" onClick={handleUpgrade} isLoading={loading}>
                <Icon name="bolt" size={18} fill />{" "}
                {!user ? "Sign in to unlock" : isGuest ? "Create account to unlock" : "Unlock Imposter+"}
              </Button>
            )
          }
        />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <MiniUnlock icon="dice" title="Sharper replay value" text="New categories, same simple rules" />
        <MiniUnlock icon="globe" title="Priority room creation" text="Fresh rooms moving faster when the lobby is busy" />
        <MiniUnlock icon="trophy" title="Better memory" text="Match history for the next game night" />
      </section>
    </AppShell>
  );
}

function TopicVaultImage() {
  return (
    <aside className="relative mx-auto w-full max-w-[720px] justify-self-center lg:justify-self-end">
      <div className="art-frame pricing-art-frame">
        <Image
          src="/assets/topic-vault-board.png"
          alt="Players around a mystery table with a magnifying glass over the hidden impostor"
          width={1448}
          height={1086}
          sizes="(min-width: 1024px) 56vw, 92vw"
          className="reference-art"
        />
      </div>
    </aside>
  );
}

function MiniUnlock({
  icon,
  title,
  text,
}: {
  icon: "dice" | "globe" | "trophy";
  title: string;
  text: string;
}) {
  return (
    <GameCard accent="cyan" className="p-5" hover={false}>
      <div className="mb-4 grid size-11 place-items-center rounded-lg border border-border bg-background/60 text-aqua-2">
        <Icon name={icon} size={22} />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
    </GameCard>
  );
}
