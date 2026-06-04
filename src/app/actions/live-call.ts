"use server";

import { z } from "zod";

import { buildLiveCallSummary } from "@/lib/live-call/build-summary";
import { generateLiveCallGuidance } from "@/lib/live-call/generate-guidance";
import {
  integrateLiveCallSessionCompleted,
  integrateLiveCallSessionStarted,
} from "@/lib/live-call/integration/integrate-call-insights";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateLiveCallSessionResult,
  EndLiveCallSessionResult,
  LiveCallMessageRecord,
  LiveCallSessionListItem,
  LiveCallSessionSnapshot,
  LiveCallMinaGuidanceContent,
  LiveCallUserMessageContent,
  SubmitLiveCallInputResult,
} from "@/types/live-call";

const sessionIdSchema = z.object({
  sessionId: z.string().uuid(),
});

const createSessionSchema = z.object({
  collectorId: z.string().uuid().optional(),
  debtSituationId: z.string().uuid().optional(),
});

const submitInputSchema = z.object({
  sessionId: z.string().uuid(),
  collectorSaid: z.string().min(1).max(4000),
  notes: z.string().max(2000).optional(),
});

function parseMessageContent(raw: unknown): LiveCallUserMessageContent | LiveCallMinaGuidanceContent {
  return raw as LiveCallUserMessageContent | LiveCallMinaGuidanceContent;
}

async function getOwnedSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string,
) {
  const { data, error } = await supabase
    .from("live_call_sessions")
    .select("id, user_id, collector_id, debt_situation_id, status, started_at, ended_at, created_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getNextSequenceNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("live_call_messages")
    .select("sequence_number")
    .eq("live_call_session_id", sessionId)
    .order("sequence_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.sequence_number ?? 0) + 1;
}

export async function createLiveCallSession(input?: {
  collectorId?: string;
  debtSituationId?: string;
}): Promise<CreateLiveCallSessionResult> {
  const parsed = createSessionSchema.safeParse(input ?? {});

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid session request.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("live_call_sessions")
    .insert({
      user_id: user.id,
      collector_id: parsed.data.collectorId ?? null,
      debt_situation_id: parsed.data.debtSituationId ?? null,
      status: "active",
    })
    .select("id, started_at, collector_id, debt_situation_id")
    .single();

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Failed to create session." };
  }

  try {
    await integrateLiveCallSessionStarted({
      supabase,
      userId: user.id,
      sessionId: data.id,
      startedAt: data.started_at,
      collectorId: data.collector_id,
      debtSituationId: data.debt_situation_id,
    });
  } catch {
    // Best-effort integration; session creation still succeeds.
  }

  return { status: "success", sessionId: data.id };
}

export async function submitLiveCallInput(input: {
  sessionId: string;
  collectorSaid: string;
  notes?: string;
}): Promise<SubmitLiveCallInputResult> {
  const parsed = submitInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid call input.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const session = await getOwnedSession(supabase, user.id, parsed.data.sessionId);

  if (!session) {
    return { status: "error", message: "Call session not found." };
  }

  if (session.status !== "active" && session.status !== "paused") {
    return { status: "error", message: "This call session is no longer active." };
  }

  const { count, error: countError } = await supabase
    .from("live_call_messages")
    .select("*", { count: "exact", head: true })
    .eq("live_call_session_id", session.id)
    .eq("role", "user");

  if (countError) {
    return { status: "error", message: countError.message };
  }

  const turnNumber = (count ?? 0) + 1;
  const userSequence = await getNextSequenceNumber(supabase, session.id);

  const userContent: LiveCallUserMessageContent = {
    text: parsed.data.collectorSaid.trim(),
    notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
  };

  const { error: userMessageError } = await supabase.from("live_call_messages").insert({
    live_call_session_id: session.id,
    sequence_number: userSequence,
    role: "user",
    message_type: "collector_input",
    content: userContent,
  });

  if (userMessageError) {
    return { status: "error", message: userMessageError.message };
  }

  const guidance = generateLiveCallGuidance({
    collectorSaid: userContent.text,
    userNotes: userContent.notes,
    turnNumber,
  });

  const minaSequence = userSequence + 1;

  const { error: minaMessageError } = await supabase.from("live_call_messages").insert({
    live_call_session_id: session.id,
    sequence_number: minaSequence,
    role: "mina",
    message_type: "mina_response",
    content: guidance,
  });

  if (minaMessageError) {
    return { status: "error", message: minaMessageError.message };
  }

  if (session.status === "paused") {
    await supabase
      .from("live_call_sessions")
      .update({ status: "active" })
      .eq("id", session.id)
      .eq("user_id", user.id);
  }

  return {
    status: "success",
    userSequence,
    minaSequence,
  };
}

export async function endLiveCallSession(input: {
  sessionId: string;
}): Promise<EndLiveCallSessionResult> {
  const parsed = sessionIdSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid session id.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const session = await getOwnedSession(supabase, user.id, parsed.data.sessionId);

  if (!session) {
    return { status: "error", message: "Call session not found." };
  }

  const { data: rawMessages, error: messagesError } = await supabase
    .from("live_call_messages")
    .select("id, sequence_number, role, message_type, content, created_at")
    .eq("live_call_session_id", session.id)
    .order("sequence_number", { ascending: true });

  if (messagesError) {
    return { status: "error", message: messagesError.message };
  }

  const messages: LiveCallMessageRecord[] = (rawMessages ?? []).map((message) => ({
    id: message.id,
    sequence_number: message.sequence_number,
    role: message.role as LiveCallMessageRecord["role"],
    message_type: message.message_type as LiveCallMessageRecord["message_type"],
    content: parseMessageContent(message.content),
    created_at: message.created_at,
  }));

  const summaryPayload = buildLiveCallSummary(messages);
  const endedAt = new Date().toISOString();

  const { data: existingSummary } = await supabase
    .from("live_call_summaries")
    .select("id")
    .eq("live_call_session_id", session.id)
    .maybeSingle();

  let summaryId: string;

  if (existingSummary) {
    const { data: updatedSummary, error: updateSummaryError } = await supabase
      .from("live_call_summaries")
      .update({
        what_happened: summaryPayload.what_happened,
        important_points: summaryPayload.important_points,
        risks: summaryPayload.risks,
        recommended_actions: summaryPayload.recommended_actions,
        next_step: summaryPayload.next_step,
        saved: true,
      })
      .eq("live_call_session_id", session.id)
      .select("id")
      .single();

    if (updateSummaryError || !updatedSummary) {
      return {
        status: "error",
        message: updateSummaryError?.message ?? "Failed to update call summary.",
      };
    }

    summaryId = updatedSummary.id;
  } else {
    const { data: insertedSummary, error: insertSummaryError } = await supabase
      .from("live_call_summaries")
      .insert({
        live_call_session_id: session.id,
        what_happened: summaryPayload.what_happened,
        important_points: summaryPayload.important_points,
        risks: summaryPayload.risks,
        recommended_actions: summaryPayload.recommended_actions,
        next_step: summaryPayload.next_step,
        saved: true,
      })
      .select("id")
      .single();

    if (insertSummaryError || !insertedSummary) {
      return {
        status: "error",
        message: insertSummaryError?.message ?? "Failed to save call summary.",
      };
    }

    summaryId = insertedSummary.id;
  }

  const { error: sessionError } = await supabase
    .from("live_call_sessions")
    .update({
      status: "completed",
      ended_at: endedAt,
    })
    .eq("id", session.id)
    .eq("user_id", user.id);

  if (sessionError) {
    return { status: "error", message: sessionError.message };
  }

  try {
    await integrateLiveCallSessionCompleted({
      supabase,
      userId: user.id,
      sessionId: session.id,
      endedAt,
      collectorId: session.collector_id,
      debtSituationId: session.debt_situation_id,
      messages,
      summary: summaryPayload,
    });
  } catch {
    // Best-effort integration; session end still succeeds.
  }

  return { status: "success", summaryId };
}

export async function getLiveCallSession(input: {
  sessionId: string;
}): Promise<LiveCallSessionSnapshot | { error: string }> {
  const parsed = sessionIdSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid session id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const session = await getOwnedSession(supabase, user.id, parsed.data.sessionId);

  if (!session) {
    return { error: "Call session not found." };
  }

  const [messagesResult, summaryResult, collectorResult] = await Promise.all([
    supabase
      .from("live_call_messages")
      .select("id, sequence_number, role, message_type, content, created_at")
      .eq("live_call_session_id", session.id)
      .order("sequence_number", { ascending: true }),
    supabase
      .from("live_call_summaries")
      .select("id, what_happened, important_points, risks, recommended_actions, next_step")
      .eq("live_call_session_id", session.id)
      .maybeSingle(),
    session.collector_id
      ? supabase
          .from("collectors")
          .select("name")
          .eq("id", session.collector_id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (messagesResult.error) {
    return { error: messagesResult.error.message };
  }

  if (summaryResult.error) {
    return { error: summaryResult.error.message };
  }

  if (collectorResult.error) {
    return { error: collectorResult.error.message };
  }

  return {
    session: session as LiveCallSessionSnapshot["session"],
    messages: (messagesResult.data ?? []).map((message) => ({
      id: message.id,
      sequence_number: message.sequence_number,
      role: message.role as LiveCallMessageRecord["role"],
      message_type: message.message_type as LiveCallMessageRecord["message_type"],
      content: parseMessageContent(message.content),
      created_at: message.created_at,
    })),
    summary: summaryResult.data
      ? {
          id: summaryResult.data.id,
          what_happened: summaryResult.data.what_happened,
          important_points: summaryResult.data.important_points as string[] | null,
          risks: summaryResult.data.risks as string[] | null,
          recommended_actions: summaryResult.data.recommended_actions as string[] | null,
          next_step: summaryResult.data.next_step,
        }
      : null,
    collectorName: collectorResult.data?.name ?? null,
  };
}

export async function listLiveCallSessions(): Promise<
  LiveCallSessionListItem[] | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: sessions, error } = await supabase
    .from("live_call_sessions")
    .select("id, status, started_at, ended_at, collector_id, collectors ( name )")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(20);

  if (error) {
    return { error: error.message };
  }

  const items: LiveCallSessionListItem[] = [];

  for (const session of sessions ?? []) {
    const { count } = await supabase
      .from("live_call_messages")
      .select("*", { count: "exact", head: true })
      .eq("live_call_session_id", session.id);

    const collectorRelation = session.collectors as
      | { name: string }
      | { name: string }[]
      | null;
    const collector = Array.isArray(collectorRelation)
      ? collectorRelation[0]
      : collectorRelation;

    items.push({
      id: session.id,
      status: session.status as LiveCallSessionListItem["status"],
      started_at: session.started_at,
      ended_at: session.ended_at,
      message_count: count ?? 0,
      collector_name: collector?.name ?? null,
    });
  }

  return items;
}
