"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function RoomsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [rooms, setRooms] = useState<
    { id: string; code: string; host_id: string; max_players: number; is_private: boolean; settings: unknown; room_players: { id: string }[] }[]
  >([]);
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

  useEffect(() => {
    async function fetchRooms() {
      const { data } = await supabase
        .from("rooms")
        .select("id, code, host_id, max_players, is_private, settings, room_players(id)")
        .eq("status", "waiting")
        .eq("is_private", false)
        .order("created_at", { ascending: false })
        .limit(20);
      setRooms(data ?? []);
      setLoadingRooms(false);
    }
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
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
      <main className="min-h-screen bg-background pt-20 pb-12 px-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-center text-4xl text-teal mb-2">Online Rooms</h1>
          <p className="text-center text-muted mb-8">
            Create or join a room to play with friends
          </p>

          <Card padding="md" className="mb-8">
            <h3 className="font-heading text-lg text-foreground mb-3">Join by Code</h3>
            <p className="text-sm text-muted mb-3">Have a room code? Enter it to join a public or private room.</p>
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

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl text-foreground">
              Public Rooms
            </h2>
            <Button variant="secondary" onClick={() => setShowCreate(true)}>
              + Create Room
            </Button>
          </div>

          {loadingRooms ? (
            <div className="text-center text-muted py-12">
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <Card padding="lg" className="text-center">
              <p className="text-muted mb-4">No public rooms available right now</p>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                Create One
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {rooms.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    hover
                    padding="md"
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-heading text-xl text-teal tracking-widest">
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
          )}
        </div>
      </main>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Room"
      >
        <div className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name in the room"
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Room Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPrivate(false)}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-3 text-center transition-all",
                  !isPrivate
                    ? "border-teal bg-teal/10 ring-1 ring-teal/40"
                    : "border-border bg-card hover:border-teal/30"
                )}
              >
                <div className="text-lg mb-1">🌐</div>
                <p className="text-sm font-medium text-foreground">Public</p>
                <p className="text-xs text-muted">Visible in room browser</p>
              </button>
              <button
                onClick={() => setIsPrivate(true)}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-3 text-center transition-all",
                  isPrivate
                    ? "border-amber bg-amber/10 ring-1 ring-amber/40"
                    : "border-border bg-card hover:border-amber/30"
                )}
              >
                <div className="text-lg mb-1">🔒</div>
                <p className="text-sm font-medium text-foreground">Private</p>
                <p className="text-xs text-muted">Join by code only</p>
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
