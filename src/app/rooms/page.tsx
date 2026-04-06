"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type RoomRow = {
  id: string;
  code: string;
  host_id: string;
  max_players: number;
  is_private: boolean;
  settings: unknown;
  room_players: { id: string }[];
};

export default function RoomsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (profile) setDisplayName(profile.username);
  }, [profile]);

  async function fetchRooms() {
    const { data } = await supabase
      .from("rooms")
      .select("id, code, host_id, max_players, is_private, settings, room_players(id)")
      .eq("status", "waiting")
      .eq("is_private", false)
      .order("created_at", { ascending: false })
      .limit(20);
    setRooms((data as RoomRow[]) ?? []);
    setLoadingRooms(false);
  }

  useEffect(() => {
    fetchRooms();

    // Real-time: re-fetch when rooms or players change
    const channel = supabase
      .channel("public-rooms-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, fetchRooms)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, fetchRooms)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleJoin(code: string) {
    if (!user) {
      toast.error("Sign in to play online");
      router.push("/login");
      return;
    }
    setJoining(true);
    const res = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        displayName: displayName || profile?.username || "Player",
      }),
    });
    const data = await res.json();
    setJoining(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to join room");
      return;
    }
    router.push(`/rooms/${code.toUpperCase()}`);
  }

  async function handleCreate() {
    if (!user) {
      toast.error("Sign in to create a room");
      router.push("/login");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/rooms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName || profile?.username || "Host",
        isPrivate,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      toast.error(data.error || "Failed to create room");
      return;
    }
    setShowCreate(false);
    setIsPrivate(false);
    router.push(`/rooms/${data.room.code}`);
  }

  return (
    <>
      <Header
        user={
          profile
            ? { username: profile.username, avatarColor: profile.avatar_color }
            : null
        }
      />
      <main className="min-h-screen bg-background pt-20 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-purple/5 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-10 -right-20 w-64 h-64 rounded-full bg-cyan/5 blur-3xl pointer-events-none" aria-hidden />

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

          {/* Public rooms header */}
          <motion.div
            className="flex items-center justify-between mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
          >
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-xl text-foreground">Public Rooms</h2>
              {/* Live indicator */}
              <span className="flex items-center gap-1.5 text-[11px] text-emerald/70">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald opacity-40" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald/70" />
                </span>
                Live
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
              Create Room
            </Button>
          </motion.div>

          {loadingRooms ? (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <svg className="size-7 animate-spin text-purple/50" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-muted">Finding rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="w-12 h-12 rounded-full bg-card-hover border border-border flex items-center justify-center mx-auto mb-4">
                <svg className="size-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <p className="text-muted text-sm mb-4">No public rooms right now</p>
              <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                Create One
              </Button>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {rooms.map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: 0.28 + i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Card hover padding="md" className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-heading text-xl text-purple tracking-widest">
                          {room.code}
                        </span>
                        <span className="text-sm text-muted">
                          {room.room_players.length}/{room.max_players} players
                        </span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleJoin(room.code)}
                        disabled={joining}
                      >
                        Join
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Room">
        <div className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
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
