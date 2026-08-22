"use client";

import { Icon } from "@/components/ui/Icon";
import { SITE_SEARCH_INDEX } from "@/lib/site-search-index";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function matches(entry: (typeof SITE_SEARCH_INDEX)[number], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    entry.title.toLowerCase().includes(q) ||
    entry.description.toLowerCase().includes(q) ||
    entry.keywords.some((k) => k.includes(q))
  );
}

/** Cmd/Ctrl+K site search — small static index, no backend needed. */
export function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => SITE_SEARCH_INDEX.filter((e) => matches(e, query)), [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setQuery("");
      setActiveIndex(0);
    });
    requestAnimationFrame(() => inputRef.current?.focus());
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    queueMicrotask(() => setActiveIndex(0));
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) go(target.href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className={cn(
          "hidden cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-muted",
          "transition-colors hover:border-brand/45 hover:text-foreground md:inline-flex",
        )}
      >
        <Icon name="eye" size={14} />
        Search
        <kbd className="rounded-md border border-border-2 bg-surface-2 px-1.5 py-0.5 font-sans text-[10px]">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="grid size-9 cursor-pointer place-items-center rounded-xl border border-border bg-surface text-foreground md:hidden"
      >
        <Icon name="eye" size={16} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <button
                  type="button"
                  aria-label="Close search"
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Site search"
                  className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] bg-card shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
                  initial={{ opacity: 0, y: -12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                >
                  <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                    <Icon name="eye" size={18} className="text-muted" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Search pages, rules, settings…"
                      className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                      aria-label="Search"
                    />
                    <kbd className="hidden shrink-0 rounded-md border border-border-2 bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted sm:block">
                      esc
                    </kbd>
                  </div>
                  <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
                    {results.length === 0 ? (
                      <li className="px-4 py-8 text-center text-sm text-muted">No matches for &ldquo;{query}&rdquo;</li>
                    ) : (
                      results.map((entry, index) => (
                        <li key={entry.href}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={index === activeIndex}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => go(entry.href)}
                            className={cn(
                              "flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors",
                              index === activeIndex ? "bg-brand/14" : "hover:bg-surface-2",
                            )}
                          >
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-brand-2">
                              <Icon name={entry.icon} size={17} />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-foreground">{entry.title}</span>
                              <span className="block truncate text-xs text-muted">{entry.description}</span>
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
