"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { isWithinActiveRoomWindow } from "@/lib/rooms/stale";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];

export function useRoom(roomCode: string) {
  const supabase = useMemo(() => createClient(), []);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  /** True only when a successful query proved the room is missing/finished/expired. */
  const [gone, setGone] = useState(false);

  function sortPlayers(items: RoomPlayer[]) {
    return [...items].sort((a, b) => {
      if (a.player_order !== b.player_order) return a.player_order - b.player_order;
      return a.created_at.localeCompare(b.created_at);
    });
  }

  const fetchRoom = useCallback(async () => {
    try {
      const { data: roomData, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode.toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!roomData || roomData.status === "finished" || !isWithinActiveRoomWindow(roomData.updated_at)) {
        // A clean answer: this room really is missing, finished, or expired.
        setRoom(null);
        setPlayers([]);
        setGone(true);
        return;
      }

      setGone(false);
      setRoom(roomData);
      const { data: playerData } = await supabase
        .from("room_players")
        .select("*")
        .eq("room_id", roomData.id)
        .order("player_order", { ascending: true });

      setPlayers(sortPlayers(playerData ?? []));
    } catch (err) {
      // The query failed — that says nothing about whether the room exists, so
      // hold whatever we already have rather than declaring the room dead.
      console.error("fetchRoom error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, roomCode]);

  useEffect(() => {
    // Safety timeout: never leave loading=true for more than 8 seconds
    const timeout = setTimeout(() => setLoading(false), 8000);
    fetchRoom().finally(() => clearTimeout(timeout));
    return () => clearTimeout(timeout);
  }, [fetchRoom]);

  const roomId = room?.id;

  useEffect(() => {
    if (!roomId) return;

    // Fallback poll at a relaxed 15s — realtime handles the fast path
    const poll = setInterval(() => {
      void fetchRoom();
    }, 15000);

    const roomChannel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const nextRoom = payload.new as Room;
            if (nextRoom.status === "finished" || !isWithinActiveRoomWindow(nextRoom.updated_at)) {
              setRoom(null);
              setPlayers([]);
              setGone(true);
            } else {
              setRoom(nextRoom);
            }
          } else if (payload.eventType === "DELETE") {
            setRoom(null);
            setPlayers([]);
            setGone(true);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => sortPlayers([...prev, payload.new as RoomPlayer]));
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) =>
              sortPlayers(prev.map((p) =>
                p.id === (payload.new as RoomPlayer).id
                  ? (payload.new as RoomPlayer)
                  : p
              ))
            );
          } else if (payload.eventType === "DELETE") {
            setPlayers((prev) =>
              sortPlayers(
                prev.filter((p) => p.id !== (payload.old as { id: string }).id)
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, supabase, fetchRoom]);

  return { room, players, loading, gone, refetch: fetchRoom };
}
