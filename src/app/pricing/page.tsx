"use client";

import {
  AppShell,
  DoodleMark,
  PageHeader,
  PricingCard,
  TopicPackChip,
} from "@/components/game";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { loginWithNext } from "@/lib/auth-path";
import { getAuthAvatarColor, getAuthAvatarUrl, getAuthDisplayName } from "@/lib/auth-display-name";
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
        avatarUrl: getAuthAvatarUrl(user, profile),
      }
    : null;

  return (
    <AppShell user={userSlot} mainClassName="max-w-6xl">
      <section className="relative grid items-center gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8">
        <DoodleMark kind="lock" className="hidden sm:block sm:-left-4 sm:top-12" color="var(--brand)" size={44} />
        <DoodleMark kind="mask" className="left-[42%] top-8 hidden lg:block" color="var(--text)" size={50} />
        <DoodleMark kind="shh" className="left-[34%] top-[45%] hidden lg:block" color="var(--heat)" size={50} rotate={8} />
        <div>
          <PageHeader
            title={
              <>
                Unlock the <span className="scribble-word" style={{ "--scribble-color": "var(--heat)" } as CSSProperties}>full</span> table
              </>
            }
          />
        </div>
        <TopicVaultImage />
      </section>

      {canceled && (
        <div className="mx-auto mb-6 max-w-xl rounded-lg border border-heat/35 bg-heat/10 px-4 py-3 text-center text-sm text-heat-2">
          Checkout canceled, no charge made
        </div>
      )}

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <PricingCard
          name="Free"
          price="$0"
          description="Everything for a table tonight"
          features={FREE_FEATURES}
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
        >
          <div className="mb-6 rounded-lg border border-heat/30 bg-heat/8 p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h4 className="text-lg font-bold">The topic drawer</h4>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Oddly specific packs, argument-friendly categories, built for bluffing
                </p>
              </div>
              <span className="text-sm font-black text-heat-2">40+ total</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PREMIUM_PACKS.map((pack) => (
                <TopicPackChip key={pack} name={pack} locked premium className="bg-background/70" />
              ))}
            </div>
          </div>
        </PricingCard>
      </section>
    </AppShell>
  );
}

function TopicVaultImage() {
  return (
    <aside className="relative mx-auto w-full max-w-[720px] justify-self-center lg:justify-self-end">
      <div className="art-frame pricing-art-frame grid min-h-[260px] place-items-center p-6 sm:min-h-[460px] sm:p-10">
        <Image
          src="/assets/imposter-premium-logo.png"
          alt="Imposter Plus logo"
          width={1254}
          height={1254}
          sizes="(min-width: 1024px) 34vw, 72vw"
          className="h-auto w-full max-w-[260px] sm:max-w-[420px]"
          priority
        />
      </div>
    </aside>
  );
}
