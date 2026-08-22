"use client";

import { AppShell, PageHeader } from "@/components/game";
import { ContactForm } from "@/components/layout/ContactForm";
import { Card } from "@/components/ui/Card";
import { getAuthAvatarColor, getAuthAvatarUrl, getAuthDisplayName } from "@/lib/auth-display-name";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";

export default function ContactPage() {
  const { user, profile } = useAuth();
  const userSlot = user
    ? {
        username: getAuthDisplayName(user, profile),
        avatarColor: getAuthAvatarColor(user, profile),
        avatarUrl: getAuthAvatarUrl(user, profile),
      }
    : null;

  return (
    <AppShell user={userSlot} mainClassName="max-w-xl">
      <PageHeader title="Contact us" description="Bug report, billing question, or just feedback. We read all of it." />
      <Card padding="lg">
        <ContactForm />
      </Card>
      <p className="mt-6 text-center text-sm text-muted">
        Looking for quick answers instead?{" "}
        <Link href="/faq" className="font-semibold text-foreground underline underline-offset-2">
          Check the FAQ
        </Link>
      </p>
    </AppShell>
  );
}
