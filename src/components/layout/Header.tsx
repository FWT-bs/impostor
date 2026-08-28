"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loginWithNext, signupWithNext } from "@/lib/auth-path";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
import { useEffect, useState, type ReactNode } from "react";

// No "Home" entry — the logo is the way home, and dropping it keeps the bar
// from competing with the page's own call to action.
const nav = [
  { href: "/local/setup", label: "Play" },
  { href: "/rooms", label: "Online" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/pricing", label: "Premium" },
] as const;

export interface HeaderUser {
  username: string;
  avatarColor: string;
}

export interface HeaderProps {
  user?: HeaderUser | null;
  authSlot?: ReactNode;
  className?: string;
}

export function Header({ user: userProp, authSlot, className }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user: authUser, profile } = useAuth();
  const loginHref = loginWithNext(pathname);
  const signupHref = signupWithNext(pathname);
  const isAnonymous = Boolean(authUser?.is_anonymous);
  const isPremium = Boolean(profile?.is_premium);

  // Use the explicit prop if provided, otherwise derive from auth state
  const user: HeaderUser | null =
    userProp !== undefined
      ? userProp
      : authUser
        ? {
            username: getAuthDisplayName(authUser, profile),
            avatarColor: getAuthAvatarColor(authUser, profile),
          }
        : null;

  /** Guests look "signed in" in the UI but must still reach Login / Sign up anytime. */
  const showLoginSignup = user === null || isAnonymous;

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <motion.header
      className={cn("fixed inset-x-0 top-0 z-40", className)}
      style={{
        background: "color-mix(in oklab, var(--bg) 88%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-4 py-[18px] sm:h-[74px] sm:gap-5 sm:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex h-10 shrink-0 items-center gap-2 rounded-xl -ml-1 px-1"
        >
          <Logo size={26} premium={isPremium} wordClassName="hidden sm:inline-block" />
        </Link>

        {/* Desktop nav. The active state is a muted grey pill rather than a
            bright capsule, so it never rivals the page's green CTA. */}
        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex" aria-label="Main">
          {nav.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative shrink-0 rounded-full px-3.5 py-2 text-[14px] font-semibold transition-colors duration-150",
                  active ? "text-foreground" : "text-nav-link hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-surface-2"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {authSlot ?? (
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <Link
                  href="/profile"
                  className="group flex min-w-0 items-center gap-2 rounded-xl border border-transparent py-1.5 pl-1.5 pr-2 transition-all duration-200 hover:border-border hover:bg-card-hover sm:gap-2.5 sm:pr-3"
                >
                  <Avatar name={user.username} color={user.avatarColor} size="sm" />
                  <span className="hidden max-w-[130px] truncate text-[13px] font-medium text-foreground transition-colors group-hover:text-brand-2 sm:inline">
                    {user.username}
                  </span>
                </Link>
              )}
              {showLoginSignup && (
                <div className="hidden items-center gap-2 sm:flex">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={loginHref}>Login</Link>
                  </Button>
                  <Button variant="primary" size="sm" asChild>
                    <Link href={signupHref}>Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg transition-all duration-200 md:hidden cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            )}
            style={{
              background: menuOpen ? "color-mix(in oklab, var(--brand) 14%, transparent)" : "var(--surface)",
              border: `1px solid ${menuOpen ? "color-mix(in oklab, var(--brand) 35%, transparent)" : "var(--border)"}`,
              color: menuOpen ? "var(--brand)" : "var(--foreground)",
            }}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <motion.div animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ duration: 0.16 }}>
              {menuOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-4"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-4"
                  aria-hidden
                >
                  <path d="M4 6h16M4 12h10M4 18h16" />
                </svg>
              )}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden md:hidden"
            style={{
              marginTop: 8,
              border: "1px solid var(--border)",
              borderRadius: 18,
              background: "color-mix(in oklab, var(--surface) 96%, transparent)",
              backdropFilter: "blur(20px)",
            }}
          >
            <nav className="flex flex-col px-3 py-3" aria-label="Mobile">
              {nav.map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <div key={href}>
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "block rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200",
                        active
                          ? "bg-brand/12 text-brand-2"
                          : "text-muted hover:text-foreground hover:bg-card-hover",
                      )}
                    >
                      {label}
                    </Link>
                  </div>
                );
              })}
              {showLoginSignup && !authSlot && (
                <motion.div
                  className="mt-2 flex flex-col gap-2 border-t pt-3 sm:hidden"
                  style={{ borderColor: "var(--border)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.14 }}
                >
                  <Button variant="secondary" size="md" asChild className="w-full">
                    <Link href={loginHref} onClick={() => setMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button variant="primary" size="md" asChild className="w-full">
                    <Link href={signupHref} onClick={() => setMenuOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
