import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chooseBotClue } from "@/lib/bots/clues";
import { finalizeRound } from "@/lib/game/finalize";
import { getPlayerIdentity, getVoterIdentity } from "@/lib/game/player-identity";
import { isWithinActiveRoomWindow } from "@/lib/rooms/stale";
import type { RoomSettings } from "@/lib/rooms/settings";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomPlayer = Database["public"]["Tables"]["room_players"]["Row"];
type GameRound = Database["public"]["Tables"]["game_rounds"]["Row"];
type PlayerSecret = Database["public"]["Tables"]["player_secrets"]["Row"];
type Vote = Database["public"]["Tables"]["votes"]["Row"];

function pickTargetForBot({
  bot,
  players,
  impostorIds,
  difficulty,
}: {
  bot: RoomPlayer;
  players: RoomPlayer[];
  impostorIds: Set<string>;
  difficulty: RoomSettings["botDifficulty"];
}) {
  const botIdentity = getPlayerIdentity(bot);
  const candidates = players.filter((player) => getPlayerIdentity(player) !== botIdentity);
  if (candidates.length === 0) return null;

  const isImpostor = impostorIds.has(botIdentity);
  if (isImpostor) {
    return candidates.find((player) => !impostorIds.has(getPlayerIdentity(player))) ?? candidates[0];
  }

  const impostorCandidates = candidates.filter((player) => impostorIds.has(getPlayerIdentity(player)));
  const honestGuessRate = difficulty === "easy" ? 0.35 : difficulty === "tricky" ? 0.7 : 0.55;
  if (impostorCandidates.length > 0 && Math.random() < honestGuessRate) {
    return impostorCandidates[Math.floor(Math.random() * impostorCandidates.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .returns<Room[]>()
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (!isWithinActiveRoomWindow(room.updated_at)) {
    await admin.rpc("cleanup_stale_rooms");
    return NextResponse.json(
      { error: "Room expired after 10 minutes of inactivity" },
      { status: 410 },
    );
  }

  const { data: players } = await admin
    .from("room_players")
    .select("*")
    .eq("room_id", room.id)
    .order("player_order", { ascending: true })
    .returns<RoomPlayer[]>();

  const roomPlayers = players ?? [];
  if (!roomPlayers.some((player) => player.user_id === user.id)) {
    return NextResponse.json({ error: "You are not in this room" }, { status: 403 });
  }

  const settings = (room.settings ?? {}) as Partial<RoomSettings>;

  if (room.phase === "clue_phase") {
    const currentPlayer = roomPlayers[room.current_turn_index];
    if (!currentPlayer?.is_bot || !currentPlayer.bot_id || !room.current_round_id) {
      return NextResponse.json({ acted: false });
    }

    const { data: secret } = await admin
      .from("player_secrets")
      .select("*")
      .eq("round_id", room.current_round_id)
      .eq("bot_id", currentPlayer.bot_id)
      .returns<PlayerSecret[]>()
      .maybeSingle();

    if (!secret) {
      return NextResponse.json({ error: "Bot secret not found" }, { status: 500 });
    }

    const clue = chooseBotClue({
      role: secret.role,
      topic: secret.topic,
      secretWord: secret.secret_word,
      botName: currentPlayer.display_name,
      difficulty: settings.botDifficulty,
      clueMode: settings.clueMode,
    });

    await admin.from("room_players").update({ clue_text: clue }).eq("id", currentPlayer.id);

    const nextIdx = room.current_turn_index + 1;
    const allDone = nextIdx >= roomPlayers.length;
    await admin
      .from("rooms")
      .update({
        current_turn_index: nextIdx,
        phase: allDone ? "discussion" : "clue_phase",
      })
      .eq("id", room.id)
      .eq("phase", "clue_phase");

    await admin.from("chat_messages").insert({
      room_id: room.id,
      user_id: null,
      display_name: "Game",
      text: `${currentPlayer.display_name} gave the hint "${clue}"`,
    });

    return NextResponse.json({ acted: true, kind: "clue", allDone });
  }

  if (room.phase !== "voting" || !room.current_round_id) {
    return NextResponse.json({ acted: false });
  }
  const roundId = room.current_round_id;

  const [{ data: round }, { data: existingVotes }] = await Promise.all([
    admin
      .from("game_rounds")
      .select("*")
      .eq("id", roundId)
      .returns<GameRound[]>()
      .maybeSingle(),
    admin
      .from("votes")
      .select("voter_id, voter_bot_id")
      .eq("round_id", roundId)
      .returns<Vote[]>(),
  ]);

  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 500 });

  const voted = new Set((existingVotes ?? []).map((vote) => getVoterIdentity(vote)).filter(Boolean));
  const impostorIds = new Set(
    [
      round.impostor_id,
      round.second_impostor_id,
      round.impostor_bot_id,
      round.second_impostor_bot_id,
    ].filter((id): id is string => Boolean(id)),
  );

  const botVotes = roomPlayers
    .filter((player) => player.is_bot && player.bot_id && !voted.has(getPlayerIdentity(player)))
    .map((bot) => {
      const target = pickTargetForBot({
        bot,
        players: roomPlayers,
        impostorIds,
        difficulty: settings.botDifficulty ?? "normal",
      });
      if (!target) return null;
      return {
        round_id: roundId,
        voter_id: null,
        voter_bot_id: bot.bot_id,
        voted_for_id: target.user_id,
        voted_for_bot_id: target.bot_id,
      };
    })
    .filter((vote): vote is NonNullable<typeof vote> => Boolean(vote));

  if (botVotes.length > 0) {
    await admin.from("votes").insert(botVotes);
    await admin.from("chat_messages").insert({
      room_id: room.id,
      user_id: null,
      display_name: "Game",
      text: "AI votes are in",
    });
  }

  const { count: voteCount } = await admin
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("round_id", roundId);

  if ((voteCount ?? 0) >= roomPlayers.length) {
    await finalizeRound(admin, room);
  }

  return NextResponse.json({ acted: botVotes.length > 0, kind: "vote", count: botVotes.length });
}
