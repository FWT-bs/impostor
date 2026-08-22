"use client";

import { ContactForm } from "@/components/layout/ContactForm";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { captureUtmParams } from "@/lib/utm";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "impostor-cookie-consent";
const BACK_TO_TOP_THRESHOLD = 480;

/**
 * One client boundary for the small, page-agnostic bits of chrome: a
 * first-visit cookie notice and the floating back-to-top / contact buttons.
 * Mounted once in the root layout.
 */
export function SiteWidgets() {
  useEffect(() => {
    captureUtmParams();
  }, []);

  return (
    <>
      <CookieConsentBanner />
      <FloatingActions />
    </>
  );
}

function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const decided = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!decided) queueMicrotask(() => setVisible(true));
    } catch {
      // localStorage unavailable — skip the banner rather than nag every load.
    }
  }, []);

  function decide(value: "accepted" | "declined") {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="print:hidden fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
      role="region"
      aria-label="Cookie notice"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-[24px] border border-border bg-card p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl" aria-hidden>🍪</span>
          <p className="text-sm text-muted">
            We use a couple of essential cookies to keep you signed in and remember your table.
            No ad trackers.{" "}
            <Link href="/cookies" className="font-semibold text-foreground underline underline-offset-2">
              Cookie policy
            </Link>
          </p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => decide("declined")}
            className="flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-foreground sm:flex-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="flex-1 cursor-pointer rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink transition-colors hover:bg-brand-2 sm:flex-none"
          >
            Got it
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function FloatingActions() {
  const [showTop, setShowTop] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > BACK_TO_TOP_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="print:hidden fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
        {showTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className={cn(
              "grid size-11 cursor-pointer place-items-center rounded-full bg-surface-2 text-foreground",
              "border border-border shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition-colors hover:bg-surface-3",
            )}
          >
            <Icon name="arrow" size={18} className="-rotate-90" />
          </motion.button>
        )}
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          aria-label="Contact us"
          className={cn(
            "grid size-12 cursor-pointer place-items-center rounded-full bg-brand text-brand-ink",
            "shadow-[0_10px_24px_rgba(24,185,100,0.32)] transition-transform hover:-translate-y-0.5 hover:bg-brand-2",
          )}
        >
          <Icon name="chat" size={20} />
        </button>
      </div>

      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Get in touch"
        titleId="floating-contact-title"
      >
        <ContactForm compact />
      </Modal>
    </>
  );
}
