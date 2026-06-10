import "server-only";

import {
  isRecoveryStage,
  RECOVERY_STAGE_LABELS,
} from "@/lib/dashboard/recovery-stage-display";
import {
  formatSituationCategoryLabel,
  formatSituationName,
  formatSituationStatusLabel,
} from "@/lib/situations/category-labels";
import { deriveSituationNextAction } from "@/lib/situations/derive-next-action";
import {
  extractSignalsFromCallMessages,
  extractSignalsFromDocuments,
  extractSignalsFromLegalAttention,
  extractSignalsFromTimeline,
  mergeSituationSignals,
} from "@/lib/situations/extract-situation-signals";
import { parseMessageContent } from "@/lib/live-call/parse-message-content";
import type { LiveCallMessageRecord } from "@/types/live-call";
import type {
  SituationListItem,
  SituationRecoveryStatus,
  SituationsListSnapshot,
} from "@/types/situations";
import type { SupabaseClient } from "@supabase/supabase-js";

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

function formatActivityLabel(title: string, occurredAt: string): string {
  const date = new Date(occurredAt);
  const formatted = Number.isNaN(date.getTime())
    ? occurredAt
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${title} · ${formatted}`;
}

function groupBySituationId<T extends { debt_situation_id: string | null }>(
  rows: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    if (!row.debt_situation_id) {
      continue;
    }

    const existing = grouped.get(row.debt_situation_id) ?? [];
    existing.push(row);
    grouped.set(row.debt_situation_id, existing);
  }

  return grouped;
}

export async function loadSituationsList(
  supabase: SupabaseClient,
  userId: string,
): Promise<SituationsListSnapshot> {
  const [situationsResult, recoveryResult] = await Promise.all([
    supabase
      .from("debt_situations")
      .select("id, category, label, status, collector_id, creditor_id, updated_at, created_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false }),
    supabase
      .from("recovery_statuses")
      .select("current_stage")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const situations = situationsResult.data ?? [];
  const situationIds = situations.map((situation) => situation.id);

  if (situationIds.length === 0) {
    const currentStageRaw = recoveryResult.data?.current_stage ?? null;
    const currentStage =
      currentStageRaw && isRecoveryStage(currentStageRaw) ? currentStageRaw : null;

    return {
      situations: [],
      recoveryStageLabel: currentStage ? RECOVERY_STAGE_LABELS[currentStage] : null,
    };
  }

  const collectorIds = [
    ...new Set(situations.map((situation) => situation.collector_id).filter(Boolean)),
  ] as string[];
  const creditorIds = [
    ...new Set(situations.map((situation) => situation.creditor_id).filter(Boolean)),
  ] as string[];

  const [
    collectorsResult,
    creditorsResult,
    documentsResult,
    timelineResult,
    callsResult,
    legalResult,
    recommendationsResult,
  ] = await Promise.all([
    collectorIds.length
      ? supabase.from("collectors").select("id, name").in("id", collectorIds)
      : Promise.resolve({ data: [], error: null }),
    creditorIds.length
      ? supabase.from("creditors").select("id, name").in("id", creditorIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("documents")
      .select(
        "id, debt_situation_id, document_type, confirmed_at, confirmed_data, created_at",
      )
      .eq("user_id", userId)
      .in("debt_situation_id", situationIds),
    supabase
      .from("timeline_events")
      .select(
        "id, debt_situation_id, title, description, occurred_at, event_category, severity, is_legal_attention",
      )
      .eq("user_id", userId)
      .in("debt_situation_id", situationIds)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("live_call_sessions")
      .select("id, debt_situation_id, status, started_at, ended_at")
      .eq("user_id", userId)
      .in("debt_situation_id", situationIds)
      .order("started_at", { ascending: false }),
    supabase
      .from("legal_attention_events")
      .select("debt_situation_id, severity")
      .eq("user_id", userId)
      .eq("status", "active")
      .in("debt_situation_id", situationIds),
    supabase
      .from("dashboard_recommendations")
      .select("title, reason, target_record_id, sort_order")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
  ]);

  const sessionIds = (callsResult.data ?? []).map((call) => call.id);
  const messagesResult =
    sessionIds.length > 0
      ? await supabase
          .from("live_call_messages")
          .select(
            "live_call_session_id, role, message_type, content, sequence_number, created_at",
          )
          .in("live_call_session_id", sessionIds)
          .order("sequence_number", { ascending: true })
      : { data: [], error: null };

  const collectorNames = new Map(
    (collectorsResult.data ?? []).map((collector) => [collector.id, collector.name]),
  );
  const creditorNames = new Map(
    (creditorsResult.data ?? []).map((creditor) => [creditor.id, creditor.name]),
  );

  const documentsBySituation = groupBySituationId(documentsResult.data ?? []);
  const timelineBySituation = groupBySituationId(timelineResult.data ?? []);
  const callsBySituation = groupBySituationId(callsResult.data ?? []);
  const legalBySituation = groupBySituationId(legalResult.data ?? []);

  const sessionToSituation = new Map(
    (callsResult.data ?? []).map((call) => [call.id, call.debt_situation_id]),
  );

  const messagesBySituation = new Map<string, LiveCallMessageRecord[]>();

  for (const message of messagesResult.data ?? []) {
    const situationId = sessionToSituation.get(message.live_call_session_id);
    if (!situationId) {
      continue;
    }

    const existing = messagesBySituation.get(situationId) ?? [];
    existing.push({
      id: `${message.live_call_session_id}-${message.sequence_number}`,
      sequence_number: message.sequence_number,
      role: message.role as LiveCallMessageRecord["role"],
      message_type: message.message_type as LiveCallMessageRecord["message_type"],
      content: parseMessageContent(message.content),
      created_at: message.created_at,
    });
    messagesBySituation.set(situationId, existing);
  }

  const documentIdsBySituation = new Map<string, string[]>();
  const sessionIdsBySituation = new Map<string, string[]>();

  for (const situationId of situationIds) {
    documentIdsBySituation.set(
      situationId,
      (documentsBySituation.get(situationId) ?? []).map((document) => document.id),
    );
    sessionIdsBySituation.set(
      situationId,
      (callsBySituation.get(situationId) ?? []).map((call) => call.id),
    );
  }

  const recommendations = recommendationsResult.data ?? [];

  const listItems: SituationListItem[] = situations.map((situation) => {
    const documents = documentsBySituation.get(situation.id) ?? [];
    const timeline = timelineBySituation.get(situation.id) ?? [];
    const legalEvents = legalBySituation.get(situation.id) ?? [];
    const callMessages = messagesBySituation.get(situation.id) ?? [];

    const signals = mergeSituationSignals([
      extractSignalsFromDocuments(documents),
      extractSignalsFromTimeline(timeline),
      extractSignalsFromCallMessages(callMessages),
      { pressure: extractSignalsFromLegalAttention(legalEvents) },
    ]);

    const linkedDocumentIds = documentIdsBySituation.get(situation.id) ?? [];
    const linkedSessionIds = sessionIdsBySituation.get(situation.id) ?? [];
    const recommendation =
      recommendations.find((entry) => linkedDocumentIds.includes(entry.target_record_id)) ??
      recommendations.find((entry) => linkedSessionIds.includes(entry.target_record_id)) ??
      null;

    const hasWrittenTerms = documents.some((document) => {
      const confirmed = document.confirmed_data as Record<string, unknown> | null;
      return Boolean(confirmed?.confirmed_at);
    });

    const hasUpcomingDeadline = timeline.some(
      (event) => event.event_category === "upcoming_deadline",
    );
    const hasLegalAttention = legalEvents.length > 0;

    const latestTimeline = timeline[0] ?? null;
    const latestCall = (callsBySituation.get(situation.id) ?? [])[0] ?? null;
    const latestDocument = documents.sort((left, right) =>
      (right.confirmed_at ?? right.created_at).localeCompare(
        left.confirmed_at ?? left.created_at,
      ),
    )[0];

    let latestActivity: string | null = null;
    let latestActivityAt: string | null = null;

    if (latestTimeline) {
      latestActivity = formatActivityLabel(latestTimeline.title, latestTimeline.occurred_at);
      latestActivityAt = latestTimeline.occurred_at;
    } else if (latestCall) {
      latestActivity = formatActivityLabel("Call session", latestCall.started_at);
      latestActivityAt = latestCall.started_at;
    } else if (latestDocument) {
      latestActivity = formatActivityLabel(
        "Document added",
        latestDocument.confirmed_at ?? latestDocument.created_at,
      );
      latestActivityAt = latestDocument.confirmed_at ?? latestDocument.created_at;
    }

    return {
      id: situation.id,
      name: formatSituationName(situation.label, situation.category),
      category: situation.category,
      categoryLabel: formatSituationCategoryLabel(situation.category),
      status: situation.status,
      statusLabel: formatSituationStatusLabel(situation.status),
      collectorName: situation.collector_id
        ? (collectorNames.get(situation.collector_id) ?? null)
        : null,
      creditorName: situation.creditor_id
        ? (creditorNames.get(situation.creditor_id) ?? null)
        : null,
      balance: signals.balance,
      latestOffer: signals.latestOffer,
      deadline: signals.deadline,
      pressure: signals.pressure,
      recoveryStatus: recoveryStatusFromPressure(signals.pressure, hasLegalAttention),
      latestActivity,
      latestActivityAt,
      nextBestAction: deriveSituationNextAction({
        signals,
        recommendation,
        hasWrittenTerms,
        hasUpcomingDeadline,
        hasLegalAttention,
      }),
      updatedAt: situation.updated_at ?? situation.created_at,
    };
  });

  const currentStageRaw = recoveryResult.data?.current_stage ?? null;
  const currentStage =
    currentStageRaw && isRecoveryStage(currentStageRaw) ? currentStageRaw : null;

  return {
    situations: listItems,
    recoveryStageLabel: currentStage ? RECOVERY_STAGE_LABELS[currentStage] : null,
  };
}
