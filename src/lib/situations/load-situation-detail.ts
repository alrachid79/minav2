import "server-only";

import {
  isRecoveryStage,
  RECOVERY_STAGE_LABELS,
} from "@/lib/dashboard/recovery-stage-display";
import { LETTER_STATUS_LABELS, LETTER_TYPE_LABELS } from "@/lib/letters/constants";
import { parseMessageContent } from "@/lib/live-call/parse-message-content";
import {
  buildFinancialProfileFromSnapshot,
  formatMoneyValue,
} from "@/lib/live-call/whisper/financial-profile";
import { financialSnapshotAnswerSchema } from "@/lib/onboarding/schemas";
import {
  formatSituationCategoryLabel,
  formatSituationName,
  formatSituationStatusLabel,
} from "@/lib/situations/category-labels";
import { deriveSituationNextAction } from "@/lib/situations/derive-next-action";
import {
  documentTypeLabel,
  extractSignalsFromCallMessages,
  extractSignalsFromDocuments,
  extractSignalsFromLegalAttention,
  extractSignalsFromTimeline,
  mergeSituationSignals,
} from "@/lib/situations/extract-situation-signals";
import type {
  SituationDetailSnapshot,
  SituationRecoveryStatus,
} from "@/types/situations";
import type { LetterStatus, LetterType } from "@/types/letters";
import type { SupabaseClient } from "@supabase/supabase-js";

function timelineSummary(description: string | null): string | null {
  if (!description) {
    return null;
  }

  const lines = description.split("\n");
  const summary = lines.find((line) => !line.startsWith("mina_event_type:"));
  return summary?.trim() ?? description.trim();
}

function recoveryStatusFromPressure(
  pressure: "Low" | "Medium" | "High",
  hasLegalAttention: boolean,
): SituationRecoveryStatus {
  if (hasLegalAttention || pressure === "High") {
    return "Needs attention";
  }

  if (pressure === "Medium") {
    return "In progress";
  }

  return "Stable";
}

export async function loadSituationDetail(
  supabase: SupabaseClient,
  userId: string,
  situationId: string,
): Promise<SituationDetailSnapshot | null> {
  const { data: situation, error: situationError } = await supabase
    .from("debt_situations")
    .select("id, category, label, status, collector_id, creditor_id, updated_at, created_at")
    .eq("id", situationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (situationError || !situation) {
    return null;
  }

  const [
    collectorResult,
    creditorResult,
    documentsResult,
    timelineResult,
    callsResult,
    lettersResult,
    legalResult,
    recommendationsResult,
    recoveryResult,
    onboardingResult,
  ] = await Promise.all([
    situation.collector_id
      ? supabase
          .from("collectors")
          .select("name")
          .eq("id", situation.collector_id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    situation.creditor_id
      ? supabase
          .from("creditors")
          .select("name")
          .eq("id", situation.creditor_id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("documents")
      .select(
        "id, original_filename, document_type, confirmed_at, confirmed_data, created_at",
      )
      .eq("user_id", userId)
      .eq("debt_situation_id", situationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("timeline_events")
      .select(
        "id, title, description, occurred_at, event_category, severity, is_legal_attention",
      )
      .eq("user_id", userId)
      .eq("debt_situation_id", situationId)
      .order("occurred_at", { ascending: false })
      .limit(12),
    supabase
      .from("live_call_sessions")
      .select("id, status, started_at, ended_at, collector_id")
      .eq("user_id", userId)
      .eq("debt_situation_id", situationId)
      .order("started_at", { ascending: false })
      .limit(8),
    supabase
      .from("letters")
      .select("id, letter_type, status, created_at")
      .eq("user_id", userId)
      .eq("debt_situation_id", situationId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("legal_attention_events")
      .select("severity")
      .eq("user_id", userId)
      .eq("debt_situation_id", situationId)
      .eq("status", "active"),
    supabase
      .from("dashboard_recommendations")
      .select("title, reason, target_record_id, sort_order")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("recovery_statuses")
      .select("current_stage")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("onboarding_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_origin_session", true)
      .maybeSingle(),
  ]);

  const sessionIds = (callsResult.data ?? []).map((call) => call.id);
  const messagesResult =
    sessionIds.length > 0
      ? await supabase
          .from("live_call_messages")
          .select("live_call_session_id, role, message_type, content, sequence_number, created_at")
          .in("live_call_session_id", sessionIds)
          .order("sequence_number", { ascending: true })
      : { data: [], error: null };

  const callMessages = (messagesResult.data ?? []).map((message) => ({
    id: message.live_call_session_id,
    sequence_number: message.sequence_number,
    role: message.role as "user" | "mina",
    message_type: message.message_type as "collector_input" | "mina_response" | "coaching",
    content: parseMessageContent(message.content),
    created_at: message.created_at,
  }));

  const documents = documentsResult.data ?? [];
  const timeline = timelineResult.data ?? [];
  const legalEvents = legalResult.data ?? [];
  const calls = callsResult.data ?? [];

  const signals = mergeSituationSignals([
    extractSignalsFromDocuments(documents),
    extractSignalsFromTimeline(timeline),
    extractSignalsFromCallMessages(callMessages),
    { pressure: extractSignalsFromLegalAttention(legalEvents) },
  ]);

  const documentIds = documents.map((document) => document.id);
  const recommendation =
    (recommendationsResult.data ?? []).find((entry) =>
      documentIds.includes(entry.target_record_id),
    ) ??
    (recommendationsResult.data ?? []).find((entry) =>
      sessionIds.includes(entry.target_record_id),
    ) ??
    null;

  const hasWrittenTerms = documents.some((document) => Boolean(document.confirmed_at));
  const hasUpcomingDeadline = timeline.some(
    (event) => event.event_category === "upcoming_deadline",
  );
  const hasLegalAttention = legalEvents.length > 0;

  let emergencyFundNote: string | null = null;

  if (onboardingResult.data?.id) {
    const { data: financialAnswer } = await supabase
      .from("onboarding_answers")
      .select("response_data")
      .eq("user_id", userId)
      .eq("onboarding_session_id", onboardingResult.data.id)
      .eq("step_key", "financial_snapshot")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const parsedFinancial = financialSnapshotAnswerSchema.safeParse(
      financialAnswer?.response_data,
    );

    if (parsedFinancial.success) {
      const profile = buildFinancialProfileFromSnapshot(parsedFinancial.data);
      if (profile.is_complete && profile.emergency_fund > 0) {
        emergencyFundNote = `Emergency fund estimate: ${formatMoneyValue(profile.emergency_fund)}`;
      }
    }
  }

  const collectorIds = [
    ...new Set(calls.map((call) => call.collector_id).filter(Boolean)),
  ] as string[];

  const callCollectorsResult =
    collectorIds.length > 0
      ? await supabase.from("collectors").select("id, name").in("id", collectorIds)
      : { data: [], error: null };

  const callCollectorNames = new Map(
    (callCollectorsResult.data ?? []).map((collector) => [collector.id, collector.name]),
  );

  const messageCounts = new Map<string, number>();
  for (const message of messagesResult.data ?? []) {
    messageCounts.set(
      message.live_call_session_id,
      (messageCounts.get(message.live_call_session_id) ?? 0) + 1,
    );
  }

  const currentStageRaw = recoveryResult.data?.current_stage ?? null;
  const currentStage =
    currentStageRaw && isRecoveryStage(currentStageRaw) ? currentStageRaw : null;

  return {
    id: situation.id,
    name: formatSituationName(situation.label, situation.category),
    category: situation.category,
    categoryLabel: formatSituationCategoryLabel(situation.category),
    status: situation.status,
    statusLabel: formatSituationStatusLabel(situation.status),
    collectorName: collectorResult.data?.name ?? null,
    creditorName: creditorResult.data?.name ?? null,
    signals,
    nextBestAction: deriveSituationNextAction({
      signals,
      recommendation,
      hasWrittenTerms,
      hasUpcomingDeadline,
      hasLegalAttention,
    }),
    recoveryStatus: recoveryStatusFromPressure(signals.pressure, hasLegalAttention),
    recoveryStageLabel: currentStage ? RECOVERY_STAGE_LABELS[currentStage] : null,
    emergencyFundNote,
    timeline: timeline.map((event) => ({
      id: event.id,
      title: event.title,
      summary: timelineSummary(event.description),
      occurredAt: event.occurred_at,
      eventCategory: event.event_category,
      severity: event.severity,
      isLegalAttention: event.is_legal_attention,
    })),
    calls: calls.map((call) => ({
      id: call.id,
      status: call.status,
      startedAt: call.started_at,
      endedAt: call.ended_at,
      messageCount: messageCounts.get(call.id) ?? 0,
      collectorName: call.collector_id
        ? (callCollectorNames.get(call.collector_id) ?? null)
        : null,
    })),
    documents: documents.map((document) => ({
      id: document.id,
      label: document.original_filename,
      documentType: document.document_type,
      documentTypeLabel: documentTypeLabel(document.document_type),
      confirmedAt: document.confirmed_at,
      createdAt: document.created_at,
    })),
    letters: (lettersResult.data ?? []).map((letter) => ({
      id: letter.id,
      letterType: letter.letter_type,
      letterTypeLabel: LETTER_TYPE_LABELS[letter.letter_type as LetterType] ?? letter.letter_type,
      status: letter.status,
      statusLabel: LETTER_STATUS_LABELS[letter.status as LetterStatus] ?? letter.status,
      createdAt: letter.created_at,
    })),
    updatedAt: situation.updated_at ?? situation.created_at,
  };
}
