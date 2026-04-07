"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Re-run getUser + profile fetch (e.g. after creating a missing profile row). */
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * One shared auth state for the whole app. Do not duplicate session logic in
 * per-component useState — that races with the singleton Supabase browser client
 * and causes random “logged in here / logged out there”, missing nicknames, etc.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
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

    supabase.auth
      .getUser()
      .then(async ({ data: { user: initialUser } }) => {
        if (cancelled) return;
        try {
          let u = initialUser ?? null;
          if (!u) {
            await new Promise((r) => setTimeout(r, 200));
            if (cancelled) return;
            const { data: again } = await supabase.auth.getUser();
            u = again.user ?? null;
          }
          setUser(u);
          await syncProfile(u);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      const nextUser = session?.user ?? null;

      // JWT refresh runs often (and stacks with proxy getUser refresh). Re-syncing
      // profile and replacing user state each time rebuilds the tree and can make
      // Realtime reconnect → SUBSCRIBED storms → feels like the page "keeps refreshing".
      if (event === "TOKEN_REFRESHED") {
        setUser((prev) => {
          if (!nextUser) return null;
          if (prev?.id === nextUser.id) return prev;
          return nextUser;
        });
        if (!cancelled) setLoading(false);
        return;
      }

      setUser(nextUser);
      await syncProfile(nextUser);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;

    const channel = supabase
      .channel(`profile-self:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${uid}`,
        },
        async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", uid)
            .maybeSingle();
          if (!error) setProfile(data ?? null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user?.id]);

  const refreshAuth = useCallback(async () => {
    const {
      data: { user: u },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      setUser(null);
      setProfile(null);
      return;
    }
    setUser(u ?? null);
    if (!u) {
      setProfile(null);
      return;
    }
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.id)
      .maybeSingle();
    setProfile(profileError ? null : data);
  }, [supabase]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return;
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  }, [router, supabase]);

  const value = useMemo(
    () => ({ user, profile, loading, signOut, refreshAuth }),
    [user, profile, loading, signOut, refreshAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
