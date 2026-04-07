"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];

export function useRoom(roomCode: string) {
  const supabase = useMemo(() => createClient(), []);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  function sortPlayers(items: RoomPlayer[]) {
    return [...items].sort((a, b) => {
      if (a.player_order !== b.player_order) return a.player_order - b.player_order;
      return a.created_at.localeCompare(b.created_at);
    });
  }

  const fetchRoom = useCallback(async () => {
    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode.toUpperCase())
      .maybeSingle();

    if (roomData) {
      setRoom(roomData);
      const { data: playerData } = await supabase
        .from("room_players")
        .select("*")
        .eq("room_id", roomData.id)
        .order("player_order", { ascending: true });

      setPlayers(sortPlayers(playerData ?? []));
    }
    setLoading(false);
  }, [supabase, roomCode]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const roomId = room?.id;

  useEffect(() => {
    if (!roomId) return;

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
            setRoom(payload.new as Room);
          } else if (payload.eventType === "DELETE") {
            setRoom(null);
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
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, supabase]);

  return { room, players, loading, refetch: fetchRoom };
}
