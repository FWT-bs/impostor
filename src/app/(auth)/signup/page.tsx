"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { InnocentFull, GhostMini, ImpostorMini } from "@/components/ui/Characters";
import { cn, randomAvatarColor } from "@/lib/utils";
import type { Session } from "@supabase/supabase-js";
import { safeNextPath } from "@/lib/auth-path";
import { postJson } from "@/lib/api-fetch";
import { syncBrowserSessionFromApi } from "@/lib/sync-browser-session";

type AuthOkResponse = { user: unknown; session: Session | null };

function SignupForm() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const avatar_color = randomAvatarColor();
      const result = await postJson<AuthOkResponse>("/api/auth/sign-up", {
        email,
        password,
        username: username.trim(),
        avatar_color,
      });
      if (!result.ok) {
        toast.error(result.errorMessage);
        return;
      }
      if (result.data.session) {
        await syncBrowserSessionFromApi(result.data.session);
        toast.success("Account ready");
        window.location.assign(nextPath);
      } else {
        toast.success("Check your email to confirm your account");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setGuestLoading(true);
    try {
      const result = await postJson<AuthOkResponse>("/api/auth/guest", {});
      if (!result.ok) {
        toast.error(result.errorMessage);
        return;
      }
      await syncBrowserSessionFromApi(result.data.session);
      toast.success("Playing as guest");
      window.location.assign(nextPath);
    } finally {
      setGuestLoading(false);
    }
  }

  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute top-20 right-1/4 w-[350px] h-[350px] rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-20 left-1/4 w-[300px] h-[300px] rounded-full bg-orange/5 blur-3xl pointer-events-none" aria-hidden />

      <motion.div
        className="absolute right-4 sm:right-12 bottom-0 hidden md:block pointer-events-none select-none"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="opacity-30"
        >
          <InnocentFull className="w-36 sm:w-44" />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute top-16 left-8 hidden sm:block pointer-events-none select-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ImpostorMini className="w-10 opacity-20" />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-16 left-12 hidden lg:block pointer-events-none select-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <GhostMini className="w-10 opacity-20" />
        </motion.div>
      </motion.div>

      <motion.div
        className={cn(
          "w-full max-w-md rounded-2xl border-2 border-border bg-card/90 backdrop-blur-sm p-8",
          "shadow-[0_0_40px_rgba(168,85,247,0.08)]",
        )}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <div className="flex justify-center mb-4">
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ImpostorMini className="w-12 opacity-60" />
          </motion.div>
        </div>
        <h1 className="text-center font-heading text-3xl tracking-wide text-foreground">
          Join the game
        </h1>
        <p className="mt-2 text-center text-sm text-muted">Create your operative profile</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-muted"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={2}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={cn(
                "mt-1.5 w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground outline-none transition-all duration-200",
                "placeholder:text-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/30",
              )}
              placeholder="Codename"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-muted"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "mt-1.5 w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground outline-none transition-all duration-200",
                "placeholder:text-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/30",
              )}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-muted"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "mt-1.5 w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground outline-none transition-all duration-200",
                "placeholder:text-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/30",
              )}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || guestLoading}
            className={cn(
              "w-full rounded-full bg-gradient-to-r from-purple to-purple-dim py-3 text-sm font-bold text-white transition-all duration-200 cursor-pointer",
              "hover:shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:brightness-110",
              "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGuest}
            disabled={loading || guestLoading}
            className={cn(
              "w-full rounded-full border-2 border-border bg-card-hover py-3 text-sm font-semibold text-foreground transition-all duration-200 cursor-pointer",
              "hover:border-purple/30 hover:text-purple hover:shadow-[0_0_16px_rgba(168,85,247,0.1)]",
              "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {guestLoading ? "Entering…" : "Continue as Guest"}
          </button>
          <p className="text-center text-sm text-muted">
            Already registered?{" "}
            <Link
              href={loginHref}
              className="font-medium text-purple hover:text-purple-glow underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <svg className="size-7 animate-spin text-purple/50" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
