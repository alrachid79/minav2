import "server-only";

import type { LiveCallTimelineEventDraft } from "@/lib/live-call/integration/build-timeline-drafts";
import type { LiveCallTimelineEventType } from "@/lib/live-call/integration/constants";
import { LIVE_CALL_SOURCE_FEATURE } from "@/lib/live-call/integration/constants";
import {
  buildLiveCallTimelineEventDescription,
  liveCallDescriptionIncludesEventType,
} from "@/lib/live-call/integration/timeline-utils";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PersistedLiveCallTimelineEvent {
  event_type: LiveCallTimelineEventType;
  timeline_event_id: string;
  created: boolean;
  summary: string;
  occurred_at: string;
}

export interface LiveCallTimelineIntegrationResult {
  integrated_at: string;
  live_call_session_id: string;
  events: PersistedLiveCallTimelineEvent[];
}

async function loadExistingLiveCallTimelineEvents(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
) {
  const { data, error } = await supabase
    .from("timeline_events")
    .select("id, description, occurred_at")
    .eq("user_id", userId)
    .eq("source_feature", LIVE_CALL_SOURCE_FEATURE)
    .eq("source_record_id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function persistLiveCallTimelineEvents(input: {
  supabase: SupabaseClient;
  userId: string;
  sessionId: string;
  integratedAt: string;
  drafts: LiveCallTimelineEventDraft[];
  collectorId: string | null;
  debtSituationId: string | null;
}): Promise<LiveCallTimelineIntegrationResult> {
  const existingEvents = await loadExistingLiveCallTimelineEvents(
    input.supabase,
    input.userId,
    input.sessionId,
  );

  const persisted: PersistedLiveCallTimelineEvent[] = [];

  for (const draft of input.drafts) {
    const existing = existingEvents.find((event) =>
      liveCallDescriptionIncludesEventType(event.description, draft.eventType),
    );

    if (existing) {
      persisted.push({
        event_type: draft.eventType,
        timeline_event_id: existing.id,
        created: false,
        summary: draft.summary,
        occurred_at: existing.occurred_at,
      });
      continue;
    }

    const { data, error } = await input.supabase
      .from("timeline_events")
      .insert({
        user_id: input.userId,
        title: draft.title,
        description: buildLiveCallTimelineEventDescription({
          eventType: draft.eventType,
          summary: draft.summary,
        }),
        occurred_at: draft.occurredAt,
        event_category: draft.eventCategory,
        source_feature: LIVE_CALL_SOURCE_FEATURE,
        source_record_id: input.sessionId,
        severity: draft.severity,
        collector_id: input.collectorId,
        debt_situation_id: input.debtSituationId,
        is_manual: false,
        is_legal_attention: draft.isLegalAttention,
        source_available: true,
      })
      .select("id, occurred_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create live call timeline event.");
    }

    persisted.push({
      event_type: draft.eventType,
      timeline_event_id: data.id,
      created: true,
      summary: draft.summary,
      occurred_at: data.occurred_at,
    });
  }

  return {
    integrated_at: input.integratedAt,
    live_call_session_id: input.sessionId,
    events: persisted,
  };
}
