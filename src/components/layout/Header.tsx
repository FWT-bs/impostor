"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ImpostorHead } from "@/components/ui/Characters";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loginWithNext, signupWithNext } from "@/lib/auth-path";
import { useState, type ReactNode } from "react";

const nav = [
  { href: "/", label: "Home" },
  { href: "/local/setup", label: "Play Local" },
  { href: "/rooms", label: "Online" },
  { href: "/leaderboard", label: "Leaderboard" },
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

  // Use the explicit prop if provided, otherwise derive from auth state
  const user: HeaderUser | null =
    userProp !== undefined
      ? userProp
      : profile
        ? { username: profile.username, avatarColor: profile.avatar_color }
        : authUser
          ? { username: authUser.email?.split("@")[0] ?? "Player", avatarColor: "#8070d4" }
          : null;

  /** Guests look "signed in" in the UI but must still reach Login / Sign up anytime. */
  const showLoginSignup = user === null || isAnonymous;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 z-40 w-full",
        className,
      )}
      style={{
        borderBottom: "1px solid rgba(28,31,58,0.6)",
        background: "rgba(8,9,26,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <motion.div
            className="relative transition-all duration-300"
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <ImpostorHead className="w-8 h-auto drop-shadow-[0_0_6px_rgba(128,112,212,0.4)]" />
          </motion.div>
          <span
            className="font-heading text-lg font-bold tracking-[0.18em] transition-colors duration-200 group-hover:text-purple-glow sm:text-xl"
            style={{ color: "var(--purple)" }}
          >
            IMPOSTOR
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          {nav.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "rgba(128,112,212,0.1)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {authSlot ?? (
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <Link
                  href="/profile"
                  className="group flex items-center gap-2 sm:gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-all duration-200"
                  style={{ border: "1px solid transparent" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(28,31,58,1)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(14,16,36,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Avatar name={user.username} color={user.avatarColor} size="sm" />
                  <span className="hidden max-w-[130px] truncate text-[13px] font-medium text-foreground transition-colors group-hover:text-purple sm:inline">
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
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple",
            )}
            style={{
              background: menuOpen ? "rgba(128,112,212,0.1)" : "rgba(14,16,36,0.6)",
              border: `1px solid ${menuOpen ? "rgba(128,112,212,0.25)" : "rgba(28,31,58,1)"}`,
              color: menuOpen ? "var(--purple)" : "var(--foreground)",
            }}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <motion.div
              animate={{ rotate: menuOpen ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
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
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="overflow-hidden md:hidden"
            style={{
              borderTop: "1px solid rgba(28,31,58,0.6)",
              background: "rgba(8,9,26,0.92)",
              backdropFilter: "blur(20px)",
            }}
          >
            <nav className="flex flex-col px-4 py-3" aria-label="Mobile">
              {nav.map(({ href, label }, i) => {
                const active =
                  href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(href);
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "block rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-purple/10 text-purple"
                          : "text-muted hover:text-foreground hover:bg-white/[0.04]",
                      )}
                    >
                      {label}
                    </Link>
                  </motion.div>
                );
              })}
              {showLoginSignup && !authSlot && (
                <motion.div
                  className="mt-2 flex flex-col gap-2 border-t pt-3 sm:hidden"
                  style={{ borderColor: "rgba(28,31,58,0.8)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
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
