"use client";

import { cn } from "@/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef } from "react";

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex rounded-2xl border border-border bg-card/82 p-1 shadow-[0_10px_22px_rgba(7,22,42,0.06)]",
        className,
      )}
      {...props}
    />
  );
});

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm font-extrabold text-muted transition-[color,background,box-shadow,transform] duration-150 cursor-pointer sm:flex-none sm:px-4 will-change-transform active:scale-[0.95]",
        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70",
        "data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-[0_8px_18px_rgba(24,185,100,0.22)]",
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70",
        className,
      )}
      {...props}
    />
  );
});
