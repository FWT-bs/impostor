"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { postJson } from "@/lib/api-fetch";
import { useAuth } from "@/lib/hooks/use-auth";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CATEGORIES = [
  { value: "feedback", label: "General feedback" },
  { value: "bug", label: "Bug report" },
  { value: "support", label: "Account or billing support" },
  { value: "other", label: "Something else" },
] as const;

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactForm({ compact = false }: { compact?: boolean }) {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>("feedback");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      if (profile?.username) setName((prev) => prev || profile.username);
      if (user?.email) setEmail((prev) => prev || user.email!);
    });
  }, [profile?.username, user?.email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setState("submitting");
    setErrorMessage("");
    const result = await postJson<{ ok: true }>("/api/feedback", {
      name,
      email,
      category,
      message: message.trim(),
      pagePath: pathname,
    });
    if (!result.ok) {
      setState("error");
      setErrorMessage(result.errorMessage);
      return;
    }
    setState("success");
    setMessage("");
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[24px] bg-emerald/10 px-6 py-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-emerald text-background">
          <Icon name="check" size={22} stroke={2.6} />
        </span>
        <h3 className="text-lg font-bold text-foreground">Message sent</h3>
        <p className="max-w-xs text-sm text-muted">
          Thanks for the note. We read every one and will reach out at the email you gave us if a reply is needed.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setState("idle")}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className={compact ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <Input
          label="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Codename"
          maxLength={80}
        />
        <Input
          label="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={254}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-foreground">What&apos;s this about?</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        label="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's going on?"
        rows={compact ? 4 : 5}
        maxLength={2000}
        required
      />

      {state === "error" && (
        <p className="rounded-xl bg-heat/10 px-4 py-3 text-sm text-heat" role="alert">
          {errorMessage || "Something went wrong. Try again in a moment."}
        </p>
      )}

      <Button type="submit" variant="primary" className="w-full" isLoading={state === "submitting"}>
        Send message
      </Button>
    </form>
  );
}
