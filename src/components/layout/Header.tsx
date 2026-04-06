"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function Header({ user, authSlot, className }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2"
        >
          <span className="text-2xl" aria-hidden>🕵️</span>
          <span className="font-heading text-lg font-bold tracking-[0.2em] text-purple group-hover:text-purple-glow transition-colors sm:text-xl">
            IMPOSTOR
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main"
        >
          {nav.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-purple/10 text-purple"
                    : "text-muted hover:bg-card/80 hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {authSlot ??
            (user ? (
              <Link href="/profile" className="flex items-center gap-2 sm:gap-3 group">
                <Avatar
                  name={user.username}
                  color={user.avatarColor}
                  size="sm"
                  className="ring-border group-hover:ring-purple/40 transition-all"
                />
                <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground group-hover:text-purple transition-colors sm:inline">
                  {user.username}
                </span>
              </Link>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            ))}

          <button
            type="button"
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full border-2 border-border bg-card text-foreground md:hidden cursor-pointer",
              "hover:bg-card-hover hover:border-purple/40 transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple",
            )}
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
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-5"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-5"
                  aria-hidden
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col px-4 py-3" aria-label="Mobile">
              {nav.map(({ href, label }) => {
                const active =
                  href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-purple/10 text-purple"
                        : "text-muted hover:text-foreground hover:bg-card/60",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
              {!user && !authSlot && (
                <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3 sm:hidden">
                  <Button variant="secondary" size="md" asChild className="w-full">
                    <Link href="/login" onClick={() => setMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button variant="primary" size="md" asChild className="w-full">
                    <Link href="/signup" onClick={() => setMenuOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
