"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useAuth() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function syncProfile(nextUser: User | null) {
      if (!nextUser) {
        if (!cancelled) setProfile(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", nextUser.id)
        .maybeSingle();
      if (cancelled) return;
      setProfile(error ? null : data);
    }

    // Eagerly load the current session so the UI doesn't flash "signed out"
    // while waiting for the first onAuthStateChange event.
    supabase.auth.getUser().then(({ data: { user: initialUser } }) => {
      if (cancelled) return;
      setUser(initialUser ?? null);
      syncProfile(initialUser ?? null).then(() => {
        if (!cancelled) setLoading(false);
      });
    });

    // Keep in sync with tab-focus refreshes, sign-in/out events, etc.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      await syncProfile(nextUser);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return;
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  }, [router, supabase]);

  return { user, profile, loading, signOut };
}
