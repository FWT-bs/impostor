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
  "mt-1.5 w-full rounded-xl border px-4 py-2.5 text-foreground outline-none transition-all duration-200",
  "placeholder:text-muted/60",
);
const fieldStyle: React.CSSProperties = { background: "var(--bg-2)", borderColor: "var(--border)" };

function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        className="card card-pad glow-ring w-full max-w-md"
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
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-muted">Email</label>
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
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted">Password</label>
            <input
              id="password" name="password" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className={fieldClass} style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              placeholder="••••••••"
            />
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
            <Link href={signupHref} className="font-medium underline-offset-4 hover:underline" style={{ color: "var(--brand-2)" }}>
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
          <span className="livedot" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
