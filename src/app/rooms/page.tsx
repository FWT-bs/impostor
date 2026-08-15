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

async function refreshSeededRooms() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    await fetch("/api/rooms/ai/ensure", {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    console.warn("ensure ai rooms:", error);
  } finally {
    clearTimeout(timeout);
  }
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
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
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
    const { data, error } = await supabase
      .from("rooms")
      .select(ROOM_LIST_SELECT)
      .eq("status", "waiting")
      .eq("is_private", false)
      .gte("updated_at", getActiveRoomCutoffIso())
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("loadOpenRooms:", error);
      return { ok: false, rooms: [] };
    }
    return { ok: true, rooms: (data as RoomRow[]) ?? [] };
  }, [supabase]);

  const loadLiveRooms = useCallback(async (): Promise<{ ok: boolean; rooms: RoomRow[] }> => {
    const { data, error } = await supabase
      .from("rooms")
      .select(ROOM_LIST_SELECT)
      .eq("status", "playing")
      .eq("is_private", false)
      .neq("phase", "results")
      .gte("updated_at", getActiveRoomCutoffIso())
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("loadLiveRooms:", error);
      return { ok: false, rooms: [] };
    }
    return { ok: true, rooms: (data as RoomRow[]) ?? [] };
  }, [supabase]);

  const loadMyRooms = useCallback(async (): Promise<{ ok: boolean; rooms: RoomRow[] }> => {
    if (!user?.id) return { ok: true, rooms: [] };

    const { data: rp, error: rpErr } = await supabase
      .from("room_players")
      .select("room_id")
      .eq("user_id", user.id);
    if (rpErr) {
      console.error("loadMyRooms room_players:", rpErr);
      return { ok: false, rooms: [] };
    }

    const ids = [...new Set((rp ?? []).map((row) => row.room_id))];
    if (ids.length === 0) return { ok: true, rooms: [] };

    const { data, error } = await supabase
      .from("rooms")
      .select(ROOM_LIST_SELECT)
      .in("id", ids)
      .in("status", ["waiting", "playing"])
      .neq("phase", "results")
      .gte("updated_at", getActiveRoomCutoffIso())
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
      if (!opts?.silent) setListError(null);
      try {
        await refreshSeededRooms();

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
            setListError("Could not load rooms, try refresh");
          } else if (!openRes.ok || !liveRes.ok || !myRes.ok) {
            setListError("Some room lists could not refresh");
          }
        }
      } catch (error) {
        console.error("refreshAllListings:", error);
        if (!opts?.silent) {
          setListError(error instanceof Error ? error.message : "Could not load rooms, try refresh");
        }
      } finally {
        if (!opts?.silent) setLoadingRooms(false);
      }
    },
    [loadLiveRooms, loadMyRooms, loadOpenRooms],
  );

  useEffect(() => {
    if (authLoading) return;
    setLoadingRooms(true);
    void refreshAllListings({ silent: false });
  }, [authLoading, refreshAllListings]);

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

  const displayRooms =
    tab === "mine" ? myRooms : tab === "live" ? liveRooms : openRooms;

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
    setJoining(true);
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
                disabled={joinCode.length !== 4 || joining}
                isLoading={joining}
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
          {loadingRooms && tab !== "open" ? (
            <LoadingRooms />
          ) : (
            <div className="space-y-5">
              {displayRooms.length === 0 ? (
                tab === "open" ? null : (
                  <EmptyRooms tab={tab} signedIn={Boolean(user)} onCreate={() => setShowCreate(true)} />
                )
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
                            joining,
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
  joining,
  authLoading,
  onJoin,
  onEnter,
}: {
  tab: RoomTab;
  room: RoomRow;
  joining: boolean;
  authLoading: boolean;
  onJoin: () => void;
  onEnter: () => void;
}) {
  if (tab === "open") {
    return (
      <Button size="sm" onClick={onJoin} disabled={joining || authLoading} isLoading={joining}>
        Join
      </Button>
    );
  }
  if (tab === "mine") {
    return (
      <Button size="sm" onClick={onEnter}>
        {room.status === "playing" ? "Play" : "Enter"}
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
      title={tab === "live" ? "No live games right now" : tab === "mine" ? "No rooms yet" : "No open tables"}
      text={tab === "open" ? "Create a public room and be first host at the table" : "Check back in a moment or start a fresh lobby"}
      action={
        tab !== "live" ? (
          <Button onClick={onCreate}>
            <Icon name="plus" size={16} /> Create room
          </Button>
        ) : undefined
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
