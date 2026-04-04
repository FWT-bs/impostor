"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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
  /** Replace default Login / Sign up buttons */
  authSlot?: ReactNode;
  className?: string;
}

export function Header({ user, authSlot, className }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-[0.2em] text-teal sm:text-xl"
        >
          IMPOSTOR
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
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-card text-teal"
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
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar
                  name={user.username}
                  color={user.avatarColor}
                  size="sm"
                  className="ring-border"
                />
                <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground sm:inline">
                  {user.username}
                </span>
              </div>
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
              "inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground md:hidden",
              "hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal",
            )}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
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
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "border-t border-border bg-background/95 backdrop-blur-md md:hidden",
          menuOpen ? "block" : "hidden",
        )}
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
                  "rounded-lg px-3 py-3 text-sm font-medium",
                  active ? "bg-card text-teal" : "text-muted",
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
      </div>
    </header>
  );
}
