"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FloatingCharacter } from "@/components/ui/FloatingCharacter";
import {
  ImpostorMini,
  DetectiveMini,
  GhostMini,
} from "@/components/ui/Characters";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { loginWithNext } from "@/lib/auth-path";

const FREE_FEATURES = [
  "All standard word categories",
  "Local party mode (pass & play)",
  "Online multiplayer rooms",
  "Basic stats tracking",
  "Leaderboard access",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Exclusive premium categories",
  "Priority room creation",
  "Detailed match history",
  "Premium badge on profile",
  "Support the developer",
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
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleManageBilling() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to open billing portal");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
        <div
          className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute bottom-10 -right-20 w-64 h-64 rounded-full bg-cyan/5 blur-3xl pointer-events-none"
          aria-hidden
        />

        <FloatingCharacter
          from="right"
          delay={0.3}
          floatAmplitude={12}
          floatDuration={5.5}
          className="absolute right-8 top-28 hidden lg:block"
        >
          <DetectiveMini className="w-10 opacity-15" />
        </FloatingCharacter>
        <FloatingCharacter
          from="left"
          delay={0.6}
          floatAmplitude={10}
          floatDuration={4.2}
          className="absolute left-10 top-40 hidden lg:block"
        >
          <GhostMini className="w-9 opacity-15" />
        </FloatingCharacter>
        <FloatingCharacter
          from="right"
          delay={0.4}
          floatAmplitude={11}
          floatDuration={5}
          className="absolute right-6 bottom-24 hidden xl:block"
        >
          <ImpostorMini className="w-12 opacity-18" />
        </FloatingCharacter>

        <div className="mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-muted/60 mb-3">
              Upgrade
            </p>
            <h1 className="font-heading text-4xl text-foreground mb-2">
              Go Premium
            </h1>
            <p className="text-sm text-muted max-w-md mx-auto">
              Unlock exclusive word categories, support ongoing development, and
              get a premium badge.
            </p>
          </motion.div>

          {canceled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <Card padding="sm" className="inline-block">
                <p className="text-sm text-orange">
                  Checkout was canceled — no charge was made.
                </p>
              </Card>
            </motion.div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Free tier */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Card
                padding="lg"
                className="h-full border-2 border-border flex flex-col"
              >
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-muted/60 mb-2">
                    Free
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-4xl text-foreground">
                      $0
                    </span>
                    <span className="text-sm text-muted">/forever</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <svg
                        className="size-4 shrink-0 mt-0.5 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      <span className="text-muted">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled
                >
                  Current plan
                </Button>
              </Card>
            </motion.div>

            {/* Premium tier */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card
                padding="lg"
                className={cn(
                  "h-full border-2 flex flex-col relative overflow-hidden",
                  isPremium
                    ? "border-emerald/40 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                    : "border-purple/40 shadow-[0_0_40px_rgba(168,85,247,0.1)]",
                )}
              >
                {/* Badge */}
                <div
                  className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
                  style={{
                    borderColor: isPremium
                      ? "rgba(16,185,129,0.3)"
                      : "rgba(168,85,247,0.3)",
                    background: isPremium
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(168,85,247,0.1)",
                    color: isPremium
                      ? "rgb(16,185,129)"
                      : "rgb(168,85,247)",
                  }}
                >
                  {isPremium ? "Active" : "Popular"}
                </div>

                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-purple/80 mb-2">
                    Premium
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-4xl text-foreground">
                      $3
                    </span>
                    <span className="text-sm text-muted">/month</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {PREMIUM_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <svg
                        className="size-4 shrink-0 mt-0.5 text-purple"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                {isPremium ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={handleManageBilling}
                    isLoading={loading}
                  >
                    Manage Billing
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleUpgrade}
                    isLoading={loading}
                  >
                    {!user
                      ? "Sign in to upgrade"
                      : isGuest
                        ? "Create account to upgrade"
                        : "Upgrade to Premium"}
                  </Button>
                )}
              </Card>
            </motion.div>
          </div>

          <motion.p
            className="text-center text-xs text-muted mt-8 max-w-sm mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Payments processed securely by Stripe. Cancel anytime from your
            billing portal. No data is stored on our servers.
          </motion.p>
        </div>
      </main>
    </>
  );
}
