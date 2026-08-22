import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, EmptyState } from "@/components/game";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist or has moved.",
};

export default function NotFound() {
  return (
    <AppShell mainClassName="max-w-xl">
      <div className="grid min-h-[60vh] place-items-center">
        <EmptyState
          icon="mask"
          title="This table's empty"
          text="The page you're looking for doesn't exist, or the round already ended. Let's get you back to a real game."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" asChild>
                <Link href="/">
                  <Icon name="mask" size={16} /> Back home
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/rooms">Browse rooms</Link>
              </Button>
            </div>
          }
        />
      </div>
    </AppShell>
  );
}
