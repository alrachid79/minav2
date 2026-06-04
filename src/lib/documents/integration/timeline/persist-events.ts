import "server-only";

import {
  buildTimelineEventDescription,
  descriptionIncludesEventType,
  DOCUMENT_ANALYSIS_SOURCE_FEATURE,
} from "@/lib/documents/integration/timeline/constants";
import type { TimelineEventDraft } from "@/lib/documents/integration/timeline/build-drafts";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PersistedTimelineEventRecord {
  event_type: TimelineEventDraft["eventType"];
  timeline_event_id: string;
  created: boolean;
  summary: string;
  severity: TimelineEventDraft["severity"];
  occurred_at: string;
}

export interface TimelineIntegrationResult {
  integrated_at: string;
  source_document_id: string;
  events: PersistedTimelineEventRecord[];
}

async function loadExistingTimelineEvents(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
) {
  const { data, error } = await supabase
    .from("timeline_events")
    .select("id, description, title, occurred_at")
    .eq("user_id", userId)
    .eq("source_feature", DOCUMENT_ANALYSIS_SOURCE_FEATURE)
    .eq("source_record_id", documentId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function integrateDocumentTimelineEvents(input: {
  supabase: SupabaseClient;
  userId: string;
  documentId: string;
  integratedAt: string;
  drafts: TimelineEventDraft[];
  collectorId: string | null;
  debtSituationId: string | null;
}): Promise<TimelineIntegrationResult> {
  const existingEvents = await loadExistingTimelineEvents(
    input.supabase,
    input.userId,
    input.documentId,
  );

  const persisted: PersistedTimelineEventRecord[] = [];

  for (const draft of input.drafts) {
    const existing = existingEvents.find((event) =>
      descriptionIncludesEventType(event.description, draft.eventType),
    );

    if (existing) {
      persisted.push({
        event_type: draft.eventType,
        timeline_event_id: existing.id,
        created: false,
        summary: draft.summary,
        severity: draft.severity,
        occurred_at: existing.occurred_at,
      });
      continue;
    }

    const { data, error } = await input.supabase
      .from("timeline_events")
      .insert({
        user_id: input.userId,
        title: draft.title,
        description: buildTimelineEventDescription({
          eventType: draft.eventType,
          summary: draft.summary,
        }),
        occurred_at: draft.occurredAt,
        event_category: draft.eventCategory,
        source_feature: DOCUMENT_ANALYSIS_SOURCE_FEATURE,
        source_record_id: input.documentId,
        severity: draft.severity,
        collector_id: input.collectorId,
        debt_situation_id: input.debtSituationId,
        is_manual: false,
        is_legal_attention: draft.eventType === "court_notice_detected",
        source_available: true,
      })
      .select("id, occurred_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create timeline event.");
    }

    persisted.push({
      event_type: draft.eventType,
      timeline_event_id: data.id,
      created: true,
      summary: draft.summary,
      severity: draft.severity,
      occurred_at: data.occurred_at,
    });
  }

  return {
    integrated_at: input.integratedAt,
    source_document_id: input.documentId,
    events: persisted,
  };
}
