"use client";

import { AppShell, PageHeader } from "@/components/game";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAuthAvatarColor, getAuthAvatarUrl, getAuthDisplayName } from "@/lib/auth-display-name";
import type { ReactNode } from "react";

export function LegalLayout({
  title,
  description,
  lastUpdated,
  children,
}: {
  title: string;
  description?: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  const { user, profile } = useAuth();
  const userSlot = user
    ? {
        username: getAuthDisplayName(user, profile),
        avatarColor: getAuthAvatarColor(user, profile),
        avatarUrl: getAuthAvatarUrl(user, profile),
      }
    : null;

  return (
    <AppShell user={userSlot} mainClassName="max-w-3xl">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button variant="secondary" size="sm" onClick={() => window.print()} className="print:hidden">
            <Icon name="copy" size={14} /> Print or save as PDF
          </Button>
        }
      />
      <p className="mb-8 text-xs font-semibold uppercase tracking-wide text-muted-2">
        Last updated {lastUpdated}
      </p>
      <div className="legal-prose flex flex-col gap-8 rounded-[32px] bg-card p-6 sm:p-10">{children}</div>
    </AppShell>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-foreground sm:text-xl">{heading}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted sm:text-[15px]">{children}</div>
    </section>
  );
}
