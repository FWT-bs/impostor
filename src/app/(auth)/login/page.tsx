"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    router.push("/");
    router.refresh();
  }

  async function handleGuest() {
    setGuestLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    setGuestLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Playing as guest");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div
        className={cn(
          "w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-[0_0_40px_rgba(0,240,255,0.06)]",
          "animate-glow-pulse"
        )}
      >
        <h1 className="text-center text-3xl tracking-wide text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Enter the briefing room
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wider text-muted"
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
                "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition",
                "placeholder:text-muted/60 focus:border-teal focus:ring-1 focus:ring-teal/40"
              )}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wider text-muted"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition",
                "placeholder:text-muted/60 focus:border-teal focus:ring-1 focus:ring-teal/40"
              )}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || guestLoading}
            className={cn(
              "w-full rounded-lg bg-teal/15 py-3 text-sm font-semibold text-teal ring-1 ring-teal/50 transition",
              "hover:bg-teal/25 disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGuest}
            disabled={loading || guestLoading}
            className={cn(
              "w-full rounded-lg border border-border bg-card-hover py-3 text-sm text-foreground transition",
              "hover:border-teal/30 hover:text-teal disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            {guestLoading ? "Entering…" : "Continue as Guest"}
          </button>
          <p className="text-center text-sm text-muted">
            No account?{" "}
            <Link
              href="/signup"
              className="font-medium text-teal hover:text-teal-dim underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
