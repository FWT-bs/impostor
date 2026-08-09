"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import type { Session } from "@supabase/supabase-js";
import { safeNextPath } from "@/lib/auth-path";
import { postJson } from "@/lib/api-fetch";
import { syncBrowserSessionFromApi } from "@/lib/sync-browser-session";

type AuthOkResponse = { user: unknown; session: Session | null };

const fieldClass = cn(
  "mt-1.5 w-full rounded-lg border px-4 py-2.5 text-foreground outline-none transition-all duration-200",
  "placeholder:text-muted/60",
);
const fieldStyle: React.CSSProperties = { backgroundColor: "var(--bg-2)", borderColor: "var(--border)" };

function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await postJson<AuthOkResponse>("/api/auth/sign-in", { email, password });
      if (!result.ok) {
        toast.error(result.errorMessage);
        return;
      }
      await syncBrowserSessionFromApi(result.data.session);
      toast.success("Signed in");
      window.location.assign(nextPath);
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

  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="grid min-h-screen items-center gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:px-10">
      <aside className="hidden max-w-xl lg:block">
        <Logo size={38} />
        <h1 className="display mt-10 text-[44px] leading-tight text-foreground">Return to the table</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          Display name, room history, premium packs, one player record
        </p>
        <div className="mt-8 grid gap-3">
          <div className="rounded-lg border border-border bg-card/70 p-4">
            <p className="text-sm font-semibold text-foreground">Session state</p>
            <p className="mt-1 text-sm text-muted">Guest play stays one click away</p>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-4">
            <p className="text-sm font-semibold text-foreground">Account boundary</p>
            <p className="mt-1 text-sm text-muted">Checkout starts after a full account exists</p>
          </div>
        </div>
      </aside>
      <motion.div
        className="card card-pad w-full max-w-md justify-self-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <div className="mb-4 flex justify-center">
          <Logo size={34} showWord={false} />
        </div>
        <h1 className="text-center text-3xl">Sign in</h1>
        <p className="mt-2 text-center text-sm text-muted">Enter the room</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase text-muted">Email</label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={fieldClass} style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase text-muted">Password</label>
            <div className="relative">
              <input
                id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className={cn(fieldClass, "pr-24")} style={fieldStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading} disabled={guestLoading}>
            Sign in
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={handleGuest} isLoading={guestLoading} disabled={loading}>
            Continue as guest
          </Button>
          <p className="text-center text-sm text-muted">
            No account?{" "}
            <Link href={signupHref} className="font-medium transition-colors hover:text-foreground" style={{ color: "var(--brand-2)" }}>
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-sm text-muted">Loading</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
