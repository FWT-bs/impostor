"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { ChatMessage } from "@/types/game";

type PlayerSecret = Database["public"]["Tables"]["player_secrets"]["Row"];

export function usePlayerSecret(roundId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [secret, setSecret] = useState<PlayerSecret | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roundId) {
      setSecret(null);
      setLoading(false);
      return;
    }

    async function fetch() {
      const { data } = await supabase
        .from("player_secrets")
        .select("*")
        .eq("round_id", roundId!)
        .maybeSingle();
      setSecret(data);
      setLoading(false);
    }

    fetch();
  }, [roundId, supabase]);

  return { secret, loading };
}

export function useVoteCount(roundId: string | null, totalPlayers: number) {
  const supabase = useMemo(() => createClient(), []);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState(0);

  const checkVote = useCallback(async () => {
    if (!roundId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("votes")
      .select("voted_for_id")
      .eq("round_id", roundId)
      .eq("voter_id", user.id)
      .maybeSingle();

    setMyVote(data?.voted_for_id ?? null);
  }, [roundId, supabase]);

  useEffect(() => {
    checkVote();
  }, [checkVote]);

  return { myVote, voteCount, checkVote };
}

export function useChat(roomId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`chat-${roomId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "chat_message" }, (payload) => {
        const msg = payload.payload as ChatMessage;
        setMessages((prev) => [...prev, msg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  const sendMessage = useCallback(
    async (text: string, userId: string, displayName: string) => {
      if (!channelRef.current) return;
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        userId,
        displayName,
        text,
        timestamp: Date.now(),
      };
      await channelRef.current.send({
        type: "broadcast",
        event: "chat_message",
        payload: msg,
      });
      setMessages((prev) => [...prev, msg]);
    },
    []
  );

  return { messages, sendMessage };
}
