"use client";

import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/hooks/use-auth";
import { loginWithNext } from "@/lib/auth-path";

const FREE_FEATURES = [
  "All standard topic packs",
  "Local pass-and-play",
  "Online multiplayer rooms",
  "Global leaderboard",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "40+ exclusive topic packs",
  "Priority room creation",
  "Detailed match history",
  "Glowing premium badge",
  "Support development",
];

const PREMIUM_PACKS = [
  "Cult Movies", "Street Food", "90s Nostalgia", "World Capitals", "Sneakerhead",
  "Boss Battles", "Cocktails", "Conspiracies", "K-Pop", "Pro Wrestling", "Cryptids", "Michelin",
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

  return (
    <>
      <Header />
      <main className="pt-24 pb-20">
        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-5 pb-8 text-center">
          <Chip tone="brand" icon="crown" className="mb-4">Upgrade</Chip>
          <h1 className="display mb-3.5" style={{ fontSize: "clamp(46px,8vw,96px)" }}>
            GO <span style={{ color: "var(--brand)" }}>PREMIUM</span>
          </h1>
          <p className="mx-auto max-w-[480px] text-[17px] leading-relaxed text-muted">
            More topics, faster rooms, and a badge that tells the table you mean business.
          </p>
          {canceled && (
            <div className="mt-5">
              <Chip tone="heat" icon="x">Checkout canceled — no charge was made</Chip>
            </div>
          )}
        </section>

        {/* ── PRICE GRID ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[880px] px-5 pb-10">
          <div className="grid gap-[18px] sm:grid-cols-2">
            {/* FREE */}
            <div className="card card-pad flex flex-col">
              <p className="kicker mb-3.5">Free</p>
              <div className="mb-[22px] flex items-baseline gap-1.5">
                <span className="display text-[56px]">$0</span>
                <span className="text-muted">forever</span>
              </div>
              <div className="flex-1">
                {FREE_FEATURES.map((f) => <Feature key={f} ok>{f}</Feature>)}
                <Feature>Premium topic packs</Feature>
                <Feature>Priority matchmaking</Feature>
              </div>
              <Button variant="secondary" size="lg" className="mt-[22px] w-full" disabled>
                {isPremium ? "Included" : "Current plan"}
              </Button>
            </div>

            {/* PREMIUM */}
            <div className="card card-pad glow-ring relative flex flex-col overflow-hidden">
              <span
                className="chip chip-brand absolute right-5 top-5"
                style={
                  isPremium
                    ? { color: "var(--emerald)", borderColor: "color-mix(in oklab, var(--emerald) 45%, transparent)" }
                    : undefined
                }
              >
                <Icon name="star" size={12} fill /> {isPremium ? "Active" : "Popular"}
              </span>
              <p className="kicker mb-3.5" style={{ color: "var(--brand-2)" }}>Imposter+</p>
              <div className="mb-[22px] flex items-baseline gap-1.5">
                <span className="display text-[56px]" style={{ color: "var(--text)" }}>$3</span>
                <span className="text-muted">/ month</span>
              </div>
              <div className="flex-1">
                {PREMIUM_FEATURES.map((f) => <Feature key={f} ok hot>{f}</Feature>)}
              </div>
              {isPremium ? (
                <Button variant="secondary" size="lg" className="mt-[22px] w-full" onClick={handleManageBilling} isLoading={loading}>
                  Manage billing
                </Button>
              ) : (
                <Button variant="primary" size="lg" className="mt-[22px] w-full" onClick={handleUpgrade} isLoading={loading}>
                  <Icon name="bolt" size={18} fill />{" "}
                  {!user ? "Sign in to upgrade" : isGuest ? "Create account to upgrade" : "Upgrade now"}
                </Button>
              )}
              <p className="mt-3 text-center text-[12px] text-muted">Secure checkout · cancel anytime</p>
            </div>
          </div>
        </section>

        {/* ── PACKS PREVIEW ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-5">
          <p className="kicker mb-4 text-center">A taste of what unlocks</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {PREMIUM_PACKS.map((p) => (
              <span
                key={p}
                className="chip text-[13px]"
                style={{ padding: "9px 15px", color: "var(--text)", borderColor: "var(--border-2)" }}
              >
                <Icon name="lock" size={13} style={{ color: "var(--brand-2)" }} /> {p}
              </span>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function Feature({ ok, hot, children }: { ok?: boolean; hot?: boolean; children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 py-[9px] text-[14.5px]"
      style={{ color: ok ? "var(--text)" : "var(--muted-2)" }}
    >
      <span
        className="grid size-5 flex-none place-items-center rounded-[7px]"
        style={{
          background: ok
            ? hot
              ? "color-mix(in oklab, var(--brand) 22%, transparent)"
              : "color-mix(in oklab, var(--emerald) 18%, transparent)"
            : "transparent",
          color: ok ? (hot ? "var(--brand-2)" : "var(--emerald)") : "var(--muted-2)",
          border: ok ? "none" : "1px solid var(--border)",
        }}
      >
        <Icon name={ok ? "check" : "x"} size={13} stroke={2.6} />
      </span>
      {children}
    </div>
  );
}
