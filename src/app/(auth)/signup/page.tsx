"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn, randomAvatarColor } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const avatar_color = randomAvatarColor();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          avatar_color,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account ready");
      router.push("/");
      router.refresh();
    } else {
      toast.success("Check your email to confirm your account");
    }
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute top-20 right-1/4 w-[350px] h-[350px] rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-20 left-1/4 w-[300px] h-[300px] rounded-full bg-orange/5 blur-3xl pointer-events-none" aria-hidden />

      <motion.div
        className={cn(
          "w-full max-w-md rounded-2xl border-2 border-border bg-card/90 backdrop-blur-sm p-8",
          "shadow-[0_0_40px_rgba(168,85,247,0.08)]",
        )}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <div className="text-center text-4xl mb-4">🎭</div>
        <h1 className="text-center font-heading text-3xl tracking-wide text-foreground">
          Join the game
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Create your operative profile
        </p>

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
                "placeholder:text-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/30"
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
                "placeholder:text-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/30"
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
                "placeholder:text-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/30"
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
              "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            {loading ? "Creating account…" : "🚀 Sign up"}
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
              "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            {guestLoading ? "Entering…" : "👻 Continue as Guest"}
          </button>
          <p className="text-center text-sm text-muted">
            Already registered?{" "}
            <Link
              href="/login"
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
