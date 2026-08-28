"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { ChatMessage } from "@/types/game";

type PlayerSecret = Database["public"]["Tables"]["player_secrets"]["Row"];

export function usePlayerSecret(roundId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [secret, setSecret] = useState<PlayerSecret | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!roundId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setSecret(null);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    const rid = roundId;

    async function fetchSecret() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("player_secrets")
        .select("*")
        .eq("round_id", rid)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setSecret(data);
        setLoading(false);
      }
    }

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    void fetchSecret();

    const channel = supabase
      .channel(`player-secret-${rid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_secrets",
          filter: `round_id=eq.${rid}`,
        },
        () => {
          void fetchSecret();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roundId, supabase]);

  return { secret, loading };
}

type ChatRow = Database["public"]["Tables"]["chat_messages"]["Row"];

function rowToMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    userId: row.user_id ?? "system",
    displayName: row.display_name,
    text: row.text,
    timestamp: Date.parse(row.created_at) || Date.now(),
  };
}

/**
 * Persistent table chat for an online room. Loads history from
 * `chat_messages`, streams new rows via realtime, and writes on send.
 * System lines (userId === "system") are stored with a NULL user_id.
 */
export function useChat(roomId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // De-dupe helper: realtime echoes our own INSERTs, so merge by id.
  const merge = useCallback((incoming: ChatMessage) => {
    setMessages((prev) =>
      prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!roomId) {
      queueMicrotask(() => {
        if (!cancelled) setMessages([]);
      });
      return () => {
        cancelled = true;
      };
    }

    async function loadHistory() {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId as string)
        .order("created_at", { ascending: true });
      if (!cancelled && data) setMessages(data.map(rowToMessage));
    }
    void loadHistory();

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => merge(rowToMessage(payload.new as ChatRow)),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, merge]);

  const sendMessage = useCallback(
    async (text: string, userId: string, displayName: string) => {
      if (!roomId) return;
      const id = crypto.randomUUID();
      const isSystem = userId === "system";
      // Optimistic — realtime echo is de-duped by id.
      merge({ id, userId, displayName, text, timestamp: Date.now() });
      await supabase.from("chat_messages").insert({
        id,
        room_id: roomId,
        user_id: isSystem ? null : userId,
        display_name: displayName,
        text,
      });
    },
    [roomId, supabase, merge],
  );

  return { messages, sendMessage };
}

/** The round's number, for the "Round N" intro and header chip. */
export function useRoundNumber(roundId: string | null): number | null {
  const supabase = useMemo(() => createClient(), []);
  const [roundNumber, setRoundNumber] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!roundId) return;

    void (async () => {
      const { data } = await supabase
        .from("game_rounds")
        .select("round_number")
        .eq("id", roundId)
        .maybeSingle();
      if (!cancelled && data) setRoundNumber(data.round_number);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, roundId]);

  return roundNumber;
}
