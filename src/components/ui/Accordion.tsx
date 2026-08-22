"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

export interface AccordionItemData {
  question: string;
  answer: ReactNode;
}

/** Single-open expandable list — used for the FAQ and settings-style disclosures. */
export function Accordion({
  items,
  className,
  defaultOpenIndex,
}: {
  items: AccordionItemData[];
  className?: string;
  defaultOpenIndex?: number;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex ?? null);

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {items.map((item, index) => (
        <AccordionRow
          key={item.question}
          item={item}
          open={openIndex === index}
          onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
        />
      ))}
    </div>
  );
}

function AccordionRow({
  item,
  open,
  onToggle,
}: {
  item: AccordionItemData;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  return (
    <div className="overflow-hidden rounded-[22px] bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-bold text-foreground sm:text-base">{item.question}</span>
        <motion.svg
          className="size-5 shrink-0 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-sm leading-relaxed text-muted">{item.answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
