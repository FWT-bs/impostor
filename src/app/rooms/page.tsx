"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { FloatingCharacter } from "@/components/ui/FloatingCharacter";
import { SpectatorFull, GhostMini, DetectiveMini } from "@/components/ui/Characters";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { postJson } from "@/lib/api-fetch";
import { loginWithNext } from "@/lib/auth-path";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
import {
  getPreferredDisplayName,
  setPreferredDisplayName,
} from "@/lib/preferred-display-name";
import { getCategories, getPremiumCategories } from "@/lib/game/words";

const MIN_ROOM_PLAYERS = 3;
const MAX_ROOM_PLAYERS = 10;

const ROOM_LIST_SELECT =
  "id, code, host_id, max_players, is_private, settings, status, room_players(id)";

type RoomRow = {
  id: string;
  code: string;
  host_id: string;
  max_players: number;
  is_private: boolean;
  settings: unknown;
  status: string;
  room_players: { id: string }[];
};

type RoomTab = "mine" | "open" | "live";

export default function RoomsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<RoomTab>("mine");
  const [myRooms, setMyRooms] = useState<RoomRow[]>([]);
  const [openRooms, setOpenRooms] = useState<RoomRow[]>([]);
  const [liveRooms, setLiveRooms] = useState<RoomRow[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [createMaxPlayers, setCreateMaxPlayers] = useState(8);
  const [createDiscussionTimer, setCreateDiscussionTimer] = useState(60);
  const [createCategory, setCreateCategory] = useState<string | null>(null);
  const [listLoadPercent, setListLoadPercent] = useState(0);

  useEffect(() => {
    const saved = getPreferredDisplayName();
    if (saved) setDisplayName(saved);
  }, []);

  useEffect(() => {
    if (!profile?.username) return;
    setDisplayName((d) => {
      if (d.trim()) return d;
      const saved = getPreferredDisplayName();
      return saved || profile.username;
    });
  }, [profile?.username]);

  const loadOpenRooms = useCallback(async (): Promise<{
    ok: boolean;
    rooms: RoomRow[];
  }> => {
    const { data, error } = await supabase
      .from("rooms")
      .select(ROOM_LIST_SELECT)
      .eq("status", "waiting")
      .eq("is_private", false)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("loadOpenRooms:", error);
      return { ok: false, rooms: [] };
    }
    return { ok: true, rooms: (data as RoomRow[]) ?? [] };
  }, [supabase]);

  const loadLiveRooms = useCallback(async (): Promise<{
    ok: boolean;
    rooms: RoomRow[];
  }> => {
    const { data, error } = await supabase
      .from("rooms")
      .select(ROOM_LIST_SELECT)
      .eq("status", "playing")
      .eq("is_private", false)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("loadLiveRooms:", error);
      return { ok: false, rooms: [] };
    }
    return { ok: true, rooms: (data as RoomRow[]) ?? [] };
  }, [supabase]);

  const loadMyRooms = useCallback(async (): Promise<{
    ok: boolean;
    rooms: RoomRow[];
  }> => {
    if (!user?.id) {
      return { ok: true, rooms: [] };
    }
    const { data: rp, error: rpErr } = await supabase
      .from("room_players")
      .select("room_id")
      .eq("user_id", user.id);
    if (rpErr) {
      console.error("loadMyRooms room_players:", rpErr);
      return { ok: false, rooms: [] };
    }
    const ids = [...new Set((rp ?? []).map((r) => r.room_id))];
    if (ids.length === 0) {
      return { ok: true, rooms: [] };
    }
    const { data, error } = await supabase
      .from("rooms")
      .select(ROOM_LIST_SELECT)
      .in("id", ids)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("loadMyRooms rooms:", error);
      return { ok: false, rooms: [] };
    }
    return { ok: true, rooms: (data as RoomRow[]) ?? [] };
  }, [supabase, user?.id]);

  const refreshAllListings = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setListError(null);
      }
      try {
        const [openRes, liveRes, myRes] = await Promise.all([
          loadOpenRooms(),
          loadLiveRooms(),
          loadMyRooms(),
        ]);

        setOpenRooms(openRes.rooms);
        setLiveRooms(liveRes.rooms);
        setMyRooms(myRes.rooms);

        if (!opts?.silent) {
          if (!openRes.ok && !liveRes.ok && !myRes.ok) {
            setListError("Could not load rooms. Try Refresh.");
          } else if (!openRes.ok || !liveRes.ok || !myRes.ok) {
            setListError("Some lists could not be refreshed.");
          }
        }
      } catch (e) {
        console.error("refreshAllListings:", e);
        if (!opts?.silent) {
          setListError(
            e instanceof Error
              ? e.message
              : "Could not load rooms. Try Refresh.",
          );
        }
      } finally {
        if (!opts?.silent) {
          setLoadingRooms(false);
        }
      }
    },
    [loadOpenRooms, loadLiveRooms, loadMyRooms],
  );

  const userId = user?.id ?? null;
  const categories = useMemo(() => getCategories(), []);
  const premiumCategories = useMemo(() => getPremiumCategories(), []);
  const isGuestUser = !user || user.is_anonymous;

  useEffect(() => {
    if (authLoading) return;
    setLoadingRooms(true);
    void refreshAllListings({ silent: false });
  }, [authLoading, refreshAllListings]);

  useEffect(() => {
    if (!loadingRooms) {
      setListLoadPercent(100);
      const done = setTimeout(() => setListLoadPercent(0), 380);
      return () => clearTimeout(done);
    }
    // Smooth continuous progress using requestAnimationFrame
    let raf: number;
    let start: number | null = null;
    setListLoadPercent(0);

    function tick(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      // Ease-out curve: fast at first, slows down approaching 95%
      const progress = Math.min(95, 95 * (1 - Math.exp(-elapsed / 1800)));
      setListLoadPercent(Math.round(progress));
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loadingRooms]);

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let firstSubscribed = true;
    function scheduleRefresh() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void refreshAllListings({ silent: true });
      }, 400);
    }

    const channel = supabase
      .channel(`public-rooms:${userId ?? "anon"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players" },
        () => scheduleRefresh()
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          if (firstSubscribed) {
            firstSubscribed = false;
            setTimeout(() => scheduleRefresh(), 650);
          } else {
            scheduleRefresh();
          }
        }
        if (status === "CHANNEL_ERROR" || err) {
          console.warn("rooms realtime:", status, err);
          scheduleRefresh();
        }
      });

    const poll = setInterval(
      () => void refreshAllListings({ silent: true }),
      15000,
    );

    function onVisible() {
      if (document.visibilityState === "visible") {
        void refreshAllListings({ silent: true });
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [supabase, refreshAllListings, userId]);

  const displayRooms =
    tab === "mine" ? myRooms : tab === "live" ? liveRooms : openRooms;

  function updateDisplayName(value: string) {
    setDisplayName(value);
    setPreferredDisplayName(value);
  }

  async function handleJoin(code: string) {
    if (authLoading) return;
    if (!user) {
      toast.error("Sign in to play online");
      router.push(loginWithNext(pathname));
      return;
    }
    setJoining(true);
    try {
      const name =
        displayName.trim() ||
        profile?.username?.trim() ||
        getAuthDisplayName(user, profile);
      const result = await postJson<{ room: { code: string } }>(
        "/api/rooms/join",
        { code, displayName: name }
      );
      if (!result.ok) {
        toast.error(result.errorMessage);
        return;
      }
      setPreferredDisplayName(name);
      void refreshAllListings({ silent: true });
      router.push(`/rooms/${code.toUpperCase()}`);
      router.refresh();
    } finally {
      setJoining(false);
    }
  }

  async function handleCreate() {
    if (authLoading) return;
    if (!user) {
      toast.error("Sign in to create a room");
      router.push(loginWithNext(pathname));
      return;
    }
    setCreating(true);
    try {
      const name =
        displayName.trim() ||
        profile?.username?.trim() ||
        getAuthDisplayName(user, profile) ||
        "Host";
      const result = await postJson<{ room: { code: string } }>(
        "/api/rooms/create",
        {
          displayName: name,
          isPrivate,
          maxPlayers: createMaxPlayers,
          category: createCategory,
          discussionTimer: createDiscussionTimer,
        },
      );
      if (!result.ok) {
        toast.error(result.errorMessage);
        return;
      }
      const code = result.data?.room?.code;
      if (!code) {
        toast.error("Room was created but the response was incomplete.");
        void refreshAllListings({ silent: true });
        return;
      }
      setPreferredDisplayName(name);
      setShowCreate(false);
      setIsPrivate(false);
      setCreateMaxPlayers(8);
      setCreateDiscussionTimer(60);
      setCreateCategory(null);
      void refreshAllListings({ silent: true });
      router.push(`/rooms/${code}`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  function closeCreateModal() {
    setShowCreate(false);
    setCreating(false);
  }

  function handleCreateCategoryClick(cat: string) {
    if (premiumCategories.has(cat) && isGuestUser) {
      toast.error("Sign in with a full account to use premium categories.");
      return;
    }
    setCreateCategory((c) => (c === cat ? null : cat));
  }

  function enterMyRoom(room: RoomRow) {
    if (room.status === "playing") {
      router.push(`/rooms/${room.code}/play`);
    } else {
      router.push(`/rooms/${room.code}`);
    }
  }

  return (
    <>
      <Header
        user={
          user
            ? {
                username: getAuthDisplayName(user, profile),
                avatarColor: getAuthAvatarColor(user, profile),
              }
            : null
        }
      />
      <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-10 -right-20 w-64 h-64 rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />

        {/* Spectator decoration */}
        <FloatingCharacter
          from="left"
          delay={0.3}
          floatAmplitude={10}
          floatDuration={4.8}
          sway
          className="absolute left-4 bottom-16 hidden xl:block"
        >
          <SpectatorFull className="w-32 opacity-18" />
        </FloatingCharacter>

        <FloatingCharacter from="right" delay={0.6} floatAmplitude={12} floatDuration={5.5} className="absolute right-8 top-28 hidden lg:block">
          <DetectiveMini className="w-10 opacity-15" />
        </FloatingCharacter>
        <FloatingCharacter from="left" delay={0.9} floatAmplitude={10} floatDuration={4.2} className="absolute left-10 top-40 hidden lg:block">
          <GhostMini className="w-9 opacity-15" />
        </FloatingCharacter>

        <div className="mx-auto max-w-2xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-muted/60 mb-3">Multiplayer</p>
            <h1 className="font-heading text-4xl text-foreground mb-2">Online Rooms</h1>
            <p className="text-sm text-muted">Create or join a room to play with friends</p>
          </motion.div>

          {/* Join by code */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
          >
            <Card padding="md" className="mb-8">
              <h3 className="font-heading text-[15px] text-foreground mb-1">Join by Code</h3>
              <p className="text-sm text-muted mb-4">Have a room code? Enter it to join any room.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="ABCD"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="bg-background uppercase tracking-widest font-heading text-lg text-center"
                  maxLength={4}
                />
                <Button
                  variant="primary"
                  onClick={() => handleJoin(joinCode)}
                  disabled={joinCode.length !== 4 || joining}
                  isLoading={joining}
                >
                  Join
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Room browser */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex rounded-2xl border-2 border-border bg-card/60 p-1 gap-1">
                {(
                  [
                    ["mine", "Mine"] as const,
                    ["open", "Open"] as const,
                    ["live", "Live"] as const,
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={cn(
                      "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer",
                      tab === key
                        ? "bg-purple/15 text-foreground border border-purple/25"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="flex items-center gap-1.5 text-[11px] text-emerald/70">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald opacity-40" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald/70" />
                  </span>
                  Sync
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setLoadingRooms(true);
                    void refreshAllListings({ silent: false });
                  }}
                  className="text-muted"
                >
                  Refresh
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
                  Create Room
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted mb-3">
              {tab === "mine" && "Rooms you’re in right now — lobby or in-game."}
              {tab === "open" && "Public lobbies that still need players."}
              {tab === "live" && "Public matches currently in progress (copy a code to ask for an invite)."}
            </p>

            {listError && (
              <p className="text-sm text-rose mb-3" role="alert">
                {listError}
              </p>
            )}

            {loadingRooms ? (
              <div className="w-full max-w-sm mx-auto py-14 px-1">
                <div
                  className="rounded-2xl border-2 border-border bg-card/70 px-6 py-8 flex flex-col items-center gap-5"
                  style={{
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.25)",
                  }}
                >
                  <svg
                    className="size-8 animate-spin text-purple/65"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground tracking-wide">
                      Loading room list…
                    </p>
                    <p className="text-[11px] text-muted uppercase tracking-[0.2em]">
                      Briefing channel
                    </p>
                  </div>
                  <div className="w-full space-y-2.5">
                    <div
                      className="h-2.5 w-full rounded-full border border-border/90 overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(14,16,36,0.95) 0%, rgba(19,21,40,0.85) 100%)",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)",
                      }}
                      role="progressbar"
                      aria-valuenow={listLoadPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, listLoadPercent)}%`,
                          background:
                            "linear-gradient(90deg, var(--purple-dim) 0%, var(--purple) 45%, var(--purple-glow) 100%)",
                          boxShadow:
                            "0 0 14px rgba(128, 112, 212, 0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
                          transition: listLoadPercent === 100
                            ? "width 0.25s ease-out"
                            : "width 0.08s linear",
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-center text-muted font-medium tabular-nums">
                      {listLoadPercent < 100 ? (
                        <>
                          Almost there · <span className="text-purple/90">{listLoadPercent}%</span>
                        </>
                      ) : (
                        <span className="text-emerald/90">Ready</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : displayRooms.length === 0 ? (
              <Card padding="lg" className="text-center">
                <p className="text-muted text-sm mb-4">
                  {tab === "mine" && !user && "Sign in to see rooms you’re part of."}
                  {tab === "mine" && user && "You’re not in any room yet. Join one from Open or use a code."}
                  {tab === "open" && "No public open lobbies right now."}
                  {tab === "live" && "No public games in progress right now."}
                </p>
                {tab === "open" && (
                  <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                    Create a room
                  </Button>
                )}
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {displayRooms.map((room, i) => (
                    <motion.div
                      key={`${tab}-${room.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: 0.06 + i * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Card hover padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-heading text-xl text-purple tracking-widest">
                            {room.code}
                          </span>
                          <span className="text-sm text-muted">
                            {room.room_players.length}/{room.max_players} players
                          </span>
                          {tab === "mine" && (
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                room.status === "playing"
                                  ? "border-emerald/30 text-emerald bg-emerald/10"
                                  : "border-purple/30 text-purple bg-purple/10",
                              )}
                            >
                              {room.status === "playing" ? "In game" : "Lobby"}
                            </span>
                          )}
                          {tab === "live" && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-orange/30 text-orange bg-orange/10">
                              Live
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {tab === "open" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleJoin(room.code)}
                              disabled={joining || authLoading}
                              isLoading={joining}
                            >
                              Join
                            </Button>
                          )}
                          {tab === "mine" && (
                            <Button variant="primary" size="sm" onClick={() => enterMyRoom(room)}>
                              Enter
                            </Button>
                          )}
                          {tab === "live" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(room.code);
                                toast.success("Room code copied");
                              }}
                            >
                              Copy code
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </main>

      <Modal open={showCreate} onClose={closeCreateModal} title="Create Room">
        <div className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => updateDisplayName(e.target.value)}
            placeholder="Your name in the room"
          />

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Room Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPrivate(false)}
                className={cn(
                  "flex-1 rounded-2xl border px-4 py-3 text-center transition-all duration-200 cursor-pointer",
                  !isPrivate
                    ? "border-purple/40 bg-purple/10 text-foreground"
                    : "border-border bg-card hover:border-purple/20 text-muted",
                )}
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="size-5 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.038 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.038-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Public</p>
                <p className="text-xs text-muted mt-0.5">Visible in room browser</p>
              </button>
              <button
                onClick={() => setIsPrivate(true)}
                className={cn(
                  "flex-1 rounded-2xl border px-4 py-3 text-center transition-all duration-200 cursor-pointer",
                  isPrivate
                    ? "border-orange/40 bg-orange/10 text-foreground"
                    : "border-border bg-card hover:border-orange/20 text-muted",
                )}
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="size-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Private</p>
                <p className="text-xs text-muted mt-0.5">Join by code only</p>
              </button>
            </div>
          </div>

          <Card padding="md" className="!bg-card/40 border border-border">
            <label className="block text-sm font-semibold text-foreground mb-3">
              Max players ({createMaxPlayers})
            </label>
            <div className="flex items-center gap-4 justify-center">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() =>
                  setCreateMaxPlayers((c) =>
                    Math.max(MIN_ROOM_PLAYERS, c - 1),
                  )
                }
                disabled={createMaxPlayers <= MIN_ROOM_PLAYERS}
                className="!rounded-full !size-10 !p-0 shrink-0"
              >
                −
              </Button>
              <span className="font-heading text-2xl text-purple min-w-[2ch] text-center">
                {createMaxPlayers}
              </span>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() =>
                  setCreateMaxPlayers((c) =>
                    Math.min(MAX_ROOM_PLAYERS, c + 1),
                  )
                }
                disabled={createMaxPlayers >= MAX_ROOM_PLAYERS}
                className="!rounded-full !size-10 !p-0 shrink-0"
              >
                +
              </Button>
            </div>
          </Card>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Discussion timer (seconds)
            </label>
            <Input
              type="number"
              min={30}
              max={300}
              value={createDiscussionTimer}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) {
                  setCreateDiscussionTimer(Math.min(300, Math.max(30, v)));
                }
              }}
              className="bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Category <span className="text-muted font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setCreateCategory(null)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-all duration-200 cursor-pointer",
                  !createCategory
                    ? "border-purple/40 bg-purple/12 text-purple"
                    : "border-border text-muted hover:border-purple/25",
                )}
              >
                Random
              </button>
              {categories.map((cat) => {
                const isPremium = premiumCategories.has(cat);
                const locked = isPremium && isGuestUser;
                const isSelected = createCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCreateCategoryClick(cat)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-all duration-200 cursor-pointer flex items-center gap-1",
                      isSelected
                        ? "border-purple/40 bg-purple/12 text-purple"
                        : locked
                          ? "border-orange/20 text-muted/60"
                          : "border-border text-muted hover:border-purple/25",
                    )}
                  >
                    {locked && (
                      <svg className="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    )}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleCreate}
            isLoading={creating}
          >
            Create {isPrivate ? "Private" : "Public"} Room
          </Button>
        </div>
      </Modal>
    </>
  );
}
