"use client";

import {
  AppShell,
  DoodleMark,
  EmptyState,
  GameCard,
  RoomCard,
  TopicPackGrid,
} from "@/components/game";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Icon, type IconName } from "@/components/ui/Icon";
import { loginWithNext } from "@/lib/auth-path";
import { postJson } from "@/lib/api-fetch";
import { getAuthAvatarColor, getAuthDisplayName } from "@/lib/auth-display-name";
import { getCategories, getPremiumCategories } from "@/lib/game/words";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  getPreferredDisplayName,
  setPreferredDisplayName,
} from "@/lib/preferred-display-name";
import type { BotDifficulty, ClueMode, ImpostorCountSetting } from "@/lib/rooms/settings";
import { getActiveRoomCutoffIso } from "@/lib/rooms/stale";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";

const MIN_ROOM_PLAYERS = 3;
const MAX_ROOM_PLAYERS = 10;

const ROOM_LIST_SELECT =
  "id, code, host_id, max_players, is_private, settings, status, phase, updated_at, room_players(id)";

/**
 * A Supabase query has no built-in timeout — a stalled fetch would hang the
 * whole listing forever. Cap every query so loading states always clear.
 *
 * Generous on purpose: the bot tables already render from the API route, so a
 * slow-but-working query is worth waiting for. Cutting it off early only turns
 * a slow page into a failed one.
 */
const QUERY_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out`)), QUERY_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer)) as Promise<T>;
}

function dedupeById(rooms: RoomRow[]): RoomRow[] {
  const byId = new Map<string, RoomRow>();
  for (const room of rooms) if (!byId.has(room.id)) byId.set(room.id, room);
  return [...byId.values()];
}

type RoomRow = {
  id: string;
  code: string;
  host_id: string;
  max_players: number;
  is_private: boolean;
  settings: unknown;
  status: string;
  phase: string;
  updated_at: string;
  room_players: { id: string }[];
};

type RoomTab = "open" | "live" | "mine";

/**
 * Seed / touch the always-on bot tables and return them.
 *
 * This runs through our own API route (admin client, server side), so it keeps
 * working even when the browser's Supabase queries fail — expired token, RLS,
 * flaky connection. Those rooms are the fallback that guarantees Live and Open
 * are never empty.
 */
async function refreshSeededRooms(): Promise<RoomRow[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);
  try {
    const res = await fetch("/api/rooms/ai/ensure", {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { rooms?: unknown };
    if (!Array.isArray(body.rooms)) return [];
    return body.rooms.filter(isRoomRow);
  } catch (error) {
    console.warn("ensure ai rooms:", error);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function isRoomRow(value: unknown): value is RoomRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<RoomRow>;
  return (
    typeof row.id === "string" &&
    typeof row.code === "string" &&
    typeof row.status === "string" &&
    Array.isArray(row.room_players)
  );
}

export default function RoomsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<RoomTab>("open");
  const [myRooms, setMyRooms] = useState<RoomRow[]>([]);
  const [openRooms, setOpenRooms] = useState<RoomRow[]>([]);
  const [liveRooms, setLiveRooms] = useState<RoomRow[]>([]);
  /** Always-on bot tables, fetched server-side; merged into Open and Live. */
  const [seededRooms, setSeededRooms] = useState<RoomRow[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  /** Code of the room currently being joined, so only that card spins. */
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [premiumPromptPack, setPremiumPromptPack] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [createMaxPlayers, setCreateMaxPlayers] = useState(8);
  const [createDiscussionTimer, setCreateDiscussionTimer] = useState(60);
  const [createVotingTimer, setCreateVotingTimer] = useState(30);
  const [createCategory, setCreateCategory] = useState<string | null>(null);
  const [createImpostorCount, setCreateImpostorCount] = useState<ImpostorCountSetting>("auto");
  const [createClueMode, setCreateClueMode] = useState<ClueMode>("classic");
  const [createBotDifficulty, setCreateBotDifficulty] = useState<BotDifficulty>("normal");

  const userId = user?.id ?? null;
  const categories = useMemo(() => getCategories(), []);
  const premiumCategories = useMemo(() => getPremiumCategories(), []);
  const hasPremium = profile?.is_premium ?? false;

  useEffect(() => {
    const saved = getPreferredDisplayName();
    if (saved) setDisplayName(saved);
  }, []);

  useEffect(() => {
    if (!profile?.username) return;
    setDisplayName((current) => {
      if (current.trim()) return current;
      return getPreferredDisplayName() || profile.username;
    });
  }, [profile?.username]);

  const loadOpenRooms = useCallback(async (): Promise<{ ok: boolean; rooms: RoomRow[] }> => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("rooms")
          .select(ROOM_LIST_SELECT)
          .eq("status", "waiting")
          .eq("is_private", false)
          .gte("updated_at", getActiveRoomCutoffIso())
          .order("created_at", { ascending: false })
          .limit(30),
        "open rooms",
      );
      if (error) throw error;
      return { ok: true, rooms: (data as RoomRow[]) ?? [] };
    } catch (error) {
      console.warn("loadOpenRooms failed:", error);
      return { ok: false, rooms: [] };
    }
  }, [supabase]);

  const loadLiveRooms = useCallback(async (): Promise<{ ok: boolean; rooms: RoomRow[] }> => {
    const cutoff = getActiveRoomCutoffIso();
    const [playing, seeded] = await Promise.allSettled([
      withTimeout(
        supabase
          .from("rooms")
          .select(ROOM_LIST_SELECT)
          .eq("status", "playing")
          .eq("is_private", false)
          .neq("phase", "results")
          .gte("updated_at", cutoff)
          .order("updated_at", { ascending: false })
          .limit(30),
        "live rooms",
      ),
      // seeded bot tables are always joinable — surface them in Live too, so
      // the tab is never empty even when no real game is running
      withTimeout(
        supabase
          .from("rooms")
          .select(ROOM_LIST_SELECT)
          .eq("is_private", false)
          .eq("settings->>aiSeeded", "true")
          .neq("phase", "results")
          .gte("updated_at", cutoff)
          .order("updated_at", { ascending: false })
          .limit(12),
        "bot tables",
      ),
    ]);

    const playingOk = playing.status === "fulfilled" && !playing.value.error;
    const seededOk = seeded.status === "fulfilled" && !seeded.value.error;
    const playingRooms = playingOk ? ((playing.value.data as RoomRow[]) ?? []) : [];
    const seededRooms = seededOk ? ((seeded.value.data as RoomRow[]) ?? []) : [];

    if (!playingOk && !seededOk) {
      // Log the reasons, not the settled wrappers — those print as "{} {}".
      console.warn(
        "loadLiveRooms failed:",
        playing.status === "rejected" ? playing.reason : playing.value.error,
        seeded.status === "rejected" ? seeded.reason : seeded.value.error,
      );
      return { ok: false, rooms: [] };
    }

    // real live games first, then the always-on bot tables
    const rooms = dedupeById([...playingRooms, ...seededRooms]).sort((a, b) => {
      const rank = (r: RoomRow) => (r.status === "playing" ? 0 : 1);
      return rank(a) - rank(b) || b.updated_at.localeCompare(a.updated_at);
    });
    return { ok: true, rooms };
  }, [supabase]);

  const loadMyRooms = useCallback(async (): Promise<{ ok: boolean; rooms: RoomRow[] }> => {
    if (!user?.id) return { ok: true, rooms: [] };
    try {
      const { data: rp, error: rpErr } = await withTimeout(
        supabase.from("room_players").select("room_id").eq("user_id", user.id),
        "my room ids",
      );
      if (rpErr) throw rpErr;

      const ids = [...new Set((rp ?? []).map((row) => row.room_id))];
      if (ids.length === 0) return { ok: true, rooms: [] };

      const { data, error } = await withTimeout(
        supabase
          .from("rooms")
          .select(ROOM_LIST_SELECT)
          .in("id", ids)
          .in("status", ["waiting", "playing"])
          .neq("phase", "results")
          .gte("updated_at", getActiveRoomCutoffIso())
          .order("updated_at", { ascending: false })
          .limit(30),
        "my rooms",
      );
      if (error) throw error;
      return { ok: true, rooms: (data as RoomRow[]) ?? [] };
    } catch (error) {
      console.warn("loadMyRooms failed:", error);
      return { ok: false, rooms: [] };
    }
  }, [supabase, user?.id]);

  const reloadListings = useCallback(async () => {
    const [openRes, liveRes, myRes] = await Promise.all([
      loadOpenRooms(),
      loadLiveRooms(),
      loadMyRooms(),
    ]);

    // Only overwrite a list when its query actually succeeded — a failed or
    // timed-out query must never blank out rooms that are already on screen.
    if (openRes.ok) setOpenRooms(openRes.rooms);
    if (liveRes.ok) setLiveRooms(liveRes.rooms);
    if (myRes.ok) setMyRooms(myRes.rooms);
    setLoadingRooms(false);

    const failed = [
      !openRes.ok && "open",
      !liveRes.ok && "live",
      !myRes.ok && "your",
    ].filter(Boolean) as string[];

    // Clear on success — including silent refreshes, so a transient blip can't
    // leave a stale error banner pinned to the page.
    if (failed.length === 0) setListError(null);
    return { openRes, liveRes, myRes, failed };
  }, [loadLiveRooms, loadMyRooms, loadOpenRooms]);

  const refreshAllListings = useCallback(
    async (opts?: { silent?: boolean }) => {
      // 1. Kick off the server-side bot tables immediately. They come from our
      //    own API route, so they land even if the browser's own queries fail.
      const seededPromise = refreshSeededRooms().then((rooms) => {
        if (rooms.length > 0) {
          setSeededRooms(rooms);
          setLoadingRooms(false);
        }
        return rooms;
      });

      // 2. In parallel, read the live DB directly for everything else.
      const result = await reloadListings().catch((error) => {
        console.error("refreshAllListings:", error);
        setLoadingRooms(false);
        return null;
      });

      const seeded = await seededPromise;

      // Only complain when we genuinely have nothing to show. If the bot tables
      // came through, the page is still usable and a banner would be noise.
      const failed = result?.failed ?? ["open", "live", "your"];
      if (!opts?.silent) {
        if (failed.length > 0 && seeded.length === 0) {
          setListError("Could not load rooms, try refresh");
        } else if (failed.length === 3) {
          setListError("Showing bot tables only — live rooms could not load");
        }
      }
    },
    [reloadListings],
  );

  useEffect(() => {
    if (authLoading) return;
    setLoadingRooms(true);
    void refreshAllListings({ silent: false });
  }, [authLoading, refreshAllListings]);

  // Absolute failsafe: never leave the spinner up longer than a query timeout.
  useEffect(() => {
    if (!loadingRooms) return;
    const t = setTimeout(() => setLoadingRooms(false), QUERY_TIMEOUT_MS + 1500);
    return () => clearTimeout(t);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => scheduleRefresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, () => scheduleRefresh())
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

    const poll = setInterval(() => void refreshAllListings({ silent: true }), 15000);
    function onVisible() {
      if (document.visibilityState === "visible") void refreshAllListings({ silent: true });
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [refreshAllListings, supabase, userId]);

  // Bot tables are always joinable, so they belong in both Open and Live —
  // merged in from the server-side result, never dependent on a browser query.
  const displayRooms = useMemo(() => {
    if (tab === "mine") return myRooms;
    const base = tab === "live" ? liveRooms : openRooms;
    return dedupeById([...base, ...seededRooms]).sort((a, b) => {
      const rank = (r: RoomRow) => (r.status === "playing" ? 0 : 1);
      return rank(a) - rank(b) || b.updated_at.localeCompare(a.updated_at);
    });
  }, [tab, myRooms, liveRooms, openRooms, seededRooms]);

  function updateDisplayName(value: string) {
    setDisplayName(value);
    setPreferredDisplayName(value);
  }

  async function handleManualRefresh() {
    setRefreshing(true);
    setLoadingRooms(true);
    try {
      await refreshAllListings({ silent: false });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleJoin(code: string) {
    const cleanCode = code.trim().toUpperCase();
    if (authLoading) return;
    if (!user) {
      toast.error("Sign in to play online");
      router.push(loginWithNext(pathname));
      return;
    }
    setJoiningCode(cleanCode);
    try {
      const name =
        displayName.trim() ||
        profile?.username?.trim() ||
        getAuthDisplayName(user, profile);
      const result = await postJson<{ room: { code: string } }>(
        "/api/rooms/join",
        { code: cleanCode, displayName: name },
      );
      if (!result.ok) {
        toast.error(result.errorMessage);
        return;
      }
      setPreferredDisplayName(name);
      void refreshAllListings({ silent: true });
      const nextCode = result.data?.room?.code ?? cleanCode;
      router.push(`/rooms/${nextCode}`);
      router.refresh();
    } finally {
      setJoiningCode(null);
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
          votingTimer: createVotingTimer,
          impostorCount: createImpostorCount,
          clueMode: createClueMode,
          botDifficulty: createBotDifficulty,
        },
      );
      if (!result.ok) {
        toast.error(result.errorMessage);
        return;
      }
      const code = result.data?.room?.code;
      if (!code) {
        toast.error("Room created, response incomplete");
        void refreshAllListings({ silent: true });
        return;
      }
      setPreferredDisplayName(name);
      setShowCreate(false);
      setIsPrivate(false);
      setCreateMaxPlayers(8);
      setCreateDiscussionTimer(60);
      setCreateVotingTimer(30);
      setCreateCategory(null);
      setCreateImpostorCount("auto");
      setCreateClueMode("classic");
      setCreateBotDifficulty("normal");
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

  function handleCreateCategoryClick(cat: string | null) {
    if (cat && premiumCategories.has(cat) && !hasPremium) {
      setPremiumPromptPack(cat);
      return;
    }
    setCreateCategory((current) => (current === cat ? null : cat));
  }

  function enterMyRoom(room: RoomRow) {
    if (room.status === "playing") router.push(`/rooms/${room.code}/play`);
    else router.push(`/rooms/${room.code}`);
  }

  const userSlot = user
    ? {
        username: getAuthDisplayName(user, profile),
        avatarColor: getAuthAvatarColor(user, profile),
      }
    : null;

  return (
    <AppShell user={userSlot} mainClassName="max-w-7xl">
      <section className="relative grid items-center gap-8 py-4 lg:grid-cols-[minmax(360px,0.72fr)_minmax(520px,1fr)] lg:gap-12">
        <DoodleMark kind="mask" className="-left-8 bottom-4" color="var(--heat)" size={38} rotate={-11} />
        <DoodleMark kind="eye" className="left-[37%] top-36 hidden lg:block" color="var(--brand)" size={46} />
        <div className="max-w-xl">
          <h1 className="tabletop-title">
            Find a <span className="scribble-word" style={{ "--scribble-color": "var(--heat)" } as CSSProperties}>table</span>
          </h1>

          <Button size="lg" className="mt-7 w-full max-w-[300px] sm:w-auto" onClick={() => setShowCreate(true)}>
            <Icon name="plus" size={22} /> Create room
          </Button>

          <div className="mt-9 max-w-[360px]">
            <p className="mb-3 text-sm font-bold text-muted">Have a code?</p>
            <div className="grid grid-cols-[58px_minmax(0,1fr)_68px] overflow-hidden rounded-xl border border-border bg-card/80 p-0.5 shadow-[0_16px_34px_rgba(0,0,0,0.22)] sm:grid-cols-[64px_minmax(0,1fr)_76px]">
              <div className="grid place-items-center border-r border-border text-xs font-bold text-muted sm:text-sm">Code</div>
              <Input
                aria-label="Room code"
                placeholder="ABCD"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                className="h-11 min-w-0 border-0 bg-transparent px-2 text-center text-base font-black uppercase tracking-normal text-white placeholder:text-white/35 focus-visible:ring-0 sm:text-lg"
                maxLength={4}
              />
              <Button
                className="h-11 min-w-0 rounded-lg px-3"
                onClick={() => handleJoin(joinCode)}
                disabled={joinCode.length !== 4 || joiningCode !== null}
                isLoading={joiningCode === joinCode.trim().toUpperCase()}
              >
                Join
              </Button>
            </div>
          </div>
        </div>
        <RoomsSpriteImage />
      </section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as RoomTab)}>
        <div className="mb-5 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="mine">My rooms</TabsTrigger>
          </TabsList>
          <Button variant="secondary" className="sm:min-w-[112px]" onClick={() => void handleManualRefresh()} isLoading={refreshing}>
            <Icon name="refresh" size={16} /> Refresh
          </Button>
        </div>

        {listError && (
          <p className="mb-4 rounded-lg border border-heat/35 bg-heat/10 px-4 py-3 text-sm text-heat-2" role="alert">
            {listError}
          </p>
        )}

        <TabsContent value={tab} className="mt-0">
          {loadingRooms && displayRooms.length === 0 ? (
            <LoadingRooms />
          ) : (
            <div className="space-y-5">
              {displayRooms.length === 0 ? (
                <EmptyRooms tab={tab} signedIn={Boolean(user)} onCreate={() => setShowCreate(true)} />
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {displayRooms.map((room, index) => (
                      <motion.div
                        key={`${tab}-${room.id}`}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ delay: index * 0.025, duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <RoomCard
                          code={room.code}
                          players={room.room_players.length}
                          maxPlayers={room.max_players}
                          status={tab === "live" ? "live" : tab === "mine" ? "mine" : "open"}
                          topic={getRoomTopic(room.settings)}
                          action={getRoomAction({
                            tab,
                            room,
                            joiningCode,
                            authLoading,
                            onJoin: () => handleJoin(room.code),
                            onEnter: () => enterMyRoom(room),
                          })}
                        />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Modal open={showCreate} onClose={closeCreateModal} title="Create a room" className="max-h-[88vh] max-w-[1180px] overflow-y-auto">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(440px,0.9fr)]">
          <div className="space-y-5">
            <Input
              label="Display name"
              value={displayName}
              onChange={(event) => updateDisplayName(event.target.value)}
              placeholder="Your name at the table"
            />

            <SectionBlock title="Room type">
              <div className="grid gap-3 sm:grid-cols-2">
                <RoomTypeButton
                  selected={!isPrivate}
                  icon="globe"
                  title="Public"
                  text="Visible in Open rooms"
                  onClick={() => setIsPrivate(false)}
                />
                <RoomTypeButton
                  selected={isPrivate}
                  icon="lock"
                  title="Private"
                  text="Join by code only"
                  onClick={() => setIsPrivate(true)}
                />
              </div>
            </SectionBlock>

            <SectionBlock title="Topic pack">
              <TopicPackGrid
                packs={categories}
                premiumPacks={premiumCategories}
                selected={createCategory}
                lockedWhenPremium={!hasPremium}
                onSelect={handleCreateCategoryClick}
                className="max-h-60 overflow-y-auto pr-1"
              />
            </SectionBlock>

            <Button
              size="lg"
              className="w-full"
              onClick={handleCreate}
              isLoading={creating}
            >
              Create {isPrivate ? "private" : "public"} room
            </Button>
          </div>

          <div className="space-y-5 xl:sticky xl:top-0">
            <div className="grid gap-3 md:grid-cols-3">
              <CounterSetting
                label="Players"
                value={createMaxPlayers}
                min={MIN_ROOM_PLAYERS}
                max={MAX_ROOM_PLAYERS}
                onDecrement={() => setCreateMaxPlayers((count) => Math.max(MIN_ROOM_PLAYERS, count - 1))}
                onIncrement={() => setCreateMaxPlayers((count) => Math.min(MAX_ROOM_PLAYERS, count + 1))}
              />
              <CounterSetting
                label="Discuss"
                value={createDiscussionTimer}
                suffix="s"
                min={30}
                max={300}
                onDecrement={() => setCreateDiscussionTimer((value) => Math.max(30, value - 15))}
                onIncrement={() => setCreateDiscussionTimer((value) => Math.min(300, value + 15))}
              />
              <CounterSetting
                label="Vote"
                value={createVotingTimer}
                suffix="s"
                min={15}
                max={180}
                onDecrement={() => setCreateVotingTimer((value) => Math.max(15, value - 5))}
                onIncrement={() => setCreateVotingTimer((value) => Math.min(180, value + 5))}
              />
            </div>

            <SectionBlock title="Impostors">
              <div className="grid gap-2 md:grid-cols-3 sm:gap-3">
                <SettingOptionButton
                  selected={createImpostorCount === "auto"}
                  icon="dice"
                  title="Auto"
                  text="scales with seats"
                  onClick={() => setCreateImpostorCount("auto")}
                />
                <SettingOptionButton
                  selected={createImpostorCount === 1}
                  icon="mask"
                  title="One"
                  text="classic table"
                  onClick={() => setCreateImpostorCount(1)}
                />
                <SettingOptionButton
                  selected={createImpostorCount === 2}
                  icon="eye"
                  title="Two"
                  text="more suspicion"
                  onClick={() => setCreateImpostorCount(2)}
                />
              </div>
            </SectionBlock>

            <SectionBlock title="Clue style">
              <div className="grid gap-2 md:grid-cols-3 sm:gap-3">
                <SettingOptionButton
                  selected={createClueMode === "classic"}
                  icon="chat"
                  title="Classic"
                  text="normal hints"
                  onClick={() => setCreateClueMode("classic")}
                />
                <SettingOptionButton
                  selected={createClueMode === "short"}
                  icon="bolt"
                  title="Short"
                  text="tight hints"
                  onClick={() => setCreateClueMode("short")}
                />
                <SettingOptionButton
                  selected={createClueMode === "single"}
                  icon="lock"
                  title="One word"
                  text="no rambling"
                  onClick={() => setCreateClueMode("single")}
                />
              </div>
            </SectionBlock>

            <SectionBlock title="Table mood">
              <div className="grid gap-2 md:grid-cols-3 sm:gap-3">
                <SettingOptionButton
                  selected={createBotDifficulty === "easy"}
                  icon="shield"
                  title="Soft"
                  text="safer clues"
                  onClick={() => setCreateBotDifficulty("easy")}
                />
                <SettingOptionButton
                  selected={createBotDifficulty === "normal"}
                  icon="eye"
                  title="Quiet"
                  text="balanced"
                  onClick={() => setCreateBotDifficulty("normal")}
                />
                <SettingOptionButton
                  selected={createBotDifficulty === "tricky"}
                  icon="mask"
                  title="Shifty"
                  text="less obvious"
                  onClick={() => setCreateBotDifficulty("tricky")}
                />
              </div>
            </SectionBlock>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(premiumPromptPack)} onClose={() => setPremiumPromptPack(null)} title="Imposter+">
        <div className="space-y-5 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-lg border border-heat/45 bg-heat/14 text-heat-2 shadow-[0_0_36px_rgba(255,55,48,0.24)]">
            <Icon name="crown" size={30} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Unlock {premiumPromptPack}</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              More packs, room priority, match history
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => setPremiumPromptPack(null)}>
              Maybe later
            </Button>
            <Button
              className="bg-brand text-black hover:bg-brand-2"
              onClick={() => router.push("/pricing")}
            >
              Unlock packs <Icon name="arrow" size={17} />
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

function RoomsSpriteImage() {
  return (
    <aside className="relative mx-auto w-full max-w-[760px] justify-self-center lg:justify-self-end">
      <div className="art-frame rooms-art-frame">
        <Image
          src="/assets/topic-vault-board.png"
          alt="Topic vault cards for online tables"
          width={1600}
          height={1200}
          sizes="(min-width: 1024px) 54vw, 92vw"
          className="reference-art max-h-[460px] object-contain object-top"
        />
      </div>
    </aside>
  );
}

function getRoomTopic(settings: unknown): string {
  if (settings && typeof settings === "object" && "category" in settings) {
    const category = (settings as { category?: unknown }).category;
    if (typeof category === "string" && category.trim()) return category;
  }
  return "Random pack";
}

function getRoomAction({
  tab,
  room,
  joiningCode,
  authLoading,
  onJoin,
  onEnter,
}: {
  tab: RoomTab;
  room: RoomRow;
  joiningCode: string | null;
  authLoading: boolean;
  onJoin: () => void;
  onEnter: () => void;
}) {
  if (tab === "mine") {
    return (
      <Button size="sm" onClick={onEnter}>
        {room.status === "playing" ? "Play" : "Enter"}
      </Button>
    );
  }
  // A room still in the lobby is joinable — even on the Live tab, where the
  // always-on bot tables show up. Only a game already in progress gets the
  // copy-code fallback.
  if (room.status === "waiting") {
    return (
      <Button
        size="sm"
        onClick={onJoin}
        disabled={joiningCode !== null || authLoading}
        isLoading={joiningCode === room.code}
      >
        Join
      </Button>
    );
  }
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(room.code);
        toast.success("Room code copied");
      }}
    >
      Copy code
    </Button>
  );
}

function EmptyRooms({
  tab,
  signedIn,
  onCreate,
}: {
  tab: RoomTab;
  signedIn: boolean;
  onCreate: () => void;
}) {
  if (tab === "mine" && !signedIn) {
    return (
      <EmptyState
        icon="lock"
        title="Sign in to see your tables"
        text="Active rooms show here once you join or create one"
      />
    );
  }
  return (
    <EmptyState
      icon={tab === "live" ? "eye" : "globe"}
      title={tab === "live" ? "Tables are warming up" : tab === "mine" ? "No rooms yet" : "No open tables"}
      text={
        tab === "open"
          ? "Create a public room and be first host at the table"
          : tab === "live"
            ? "The bot tables should appear in a second — hit refresh, or start your own."
            : "Check back in a moment or start a fresh lobby"
      }
      action={
        <Button onClick={onCreate}>
          <Icon name="plus" size={16} /> Create room
        </Button>
      }
    />
  );
}

function LoadingRooms() {
  return (
    <GameCard className="mx-auto max-w-md p-8 text-center" accent="cyan">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-lg border border-aqua/35 bg-aqua/10 text-aqua-2">
        <svg className="size-7 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold">Loading rooms</h2>
    </GameCard>
  );
}

function RoomTypeButton({
  selected,
  icon,
  title,
  text,
  onClick,
}: {
  selected: boolean;
  icon: "globe" | "lock";
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors cursor-pointer sm:p-4",
        selected ? "border-brand/50 bg-brand/14" : "border-border bg-card/65 hover:border-brand/35",
      )}
    >
      <div className="mb-3 grid size-10 place-items-center rounded-lg border border-border bg-background/60 text-brand-2">
        <Icon name={icon} size={20} />
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted">{text}</p>
    </button>
  );
}

function SettingOptionButton({
  selected,
  icon,
  title,
  text,
  onClick,
}: {
  selected: boolean;
  icon: IconName;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors cursor-pointer sm:p-3",
        selected ? "border-brand/50 bg-brand/14" : "border-border bg-card/65 hover:border-brand/35",
      )}
      aria-pressed={selected}
    >
      <div className="mb-2 grid size-8 place-items-center rounded-lg border border-border bg-background/60 text-brand-2">
        <Icon name={icon} size={17} />
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-muted sm:text-xs">{text}</p>
    </button>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-foreground">{title}</label>
      {children}
    </div>
  );
}

function CounterSetting({
  label,
  value,
  suffix,
  min,
  max,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/45 p-4">
      <label className="mb-3 block text-sm font-semibold text-foreground">{label}</label>
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          className="size-10 rounded-lg p-0"
        >
          <Icon name="minus" size={16} />
        </Button>
        <span className="display min-w-[2ch] text-center text-4xl text-brand-2">
          {value}
          {suffix ? <span className="ml-1 text-2xl">{suffix}</span> : null}
        </span>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={onIncrement}
          disabled={value >= max}
          className="size-10 rounded-lg p-0"
        >
          <Icon name="plus" size={16} />
        </Button>
      </div>
    </div>
  );
}
