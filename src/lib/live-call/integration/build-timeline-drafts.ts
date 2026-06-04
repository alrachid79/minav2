import "server-only";

import {
  INSIGHT_TO_TIMELINE_EVENT,
  LIVE_CALL_TIMELINE_EVENT_LABELS,
  type LiveCallTimelineEventType,
} from "@/lib/live-call/integration/constants";
import type {
  LiveCallInsightDetail,
  LiveCallInsights,
} from "@/lib/live-call/integration/extract-insights";
import { buildLiveCallInsightDetails } from "@/lib/live-call/integration/extract-insights";

export interface LiveCallTimelineEventDraft {
  eventType: LiveCallTimelineEventType;
  title: string;
  summary: string;
  occurredAt: string;
  eventCategory: "past_event" | "upcoming_deadline";
  severity: "info" | "attention";
  isLegalAttention: boolean;
}

function baseDraft(input: {
  eventType: LiveCallTimelineEventType;
  summary: string;
  occurredAt: string;
  severity: "info" | "attention";
  isLegalAttention?: boolean;
}): LiveCallTimelineEventDraft {
  return {
    eventType: input.eventType,
    title: LIVE_CALL_TIMELINE_EVENT_LABELS[input.eventType],
    summary: input.summary,
    occurredAt: input.occurredAt,
    eventCategory: "past_event",
    severity: input.severity,
    isLegalAttention: input.isLegalAttention ?? false,
  };
}

export function buildLiveCallStartedTimelineDraft(input: {
  startedAt: string;
  collectorName: string | null;
}): LiveCallTimelineEventDraft {
  return baseDraft({
    eventType: "call_started",
    summary: input.collectorName
      ? `Live call coaching session started (${input.collectorName}).`
      : "Live call coaching session started.",
    occurredAt: input.startedAt,
    severity: "info",
  });
}

export function buildLiveCallCompletedTimelineDraft(input: {
  endedAt: string;
  collectorName: string | null;
  turnCount: number;
}): LiveCallTimelineEventDraft {
  const turns =
    input.turnCount === 0
      ? "No conversation turns were recorded."
      : `${input.turnCount} conversation turn${input.turnCount === 1 ? "" : "s"} recorded.`;

  return baseDraft({
    eventType: "call_completed",
    summary: input.collectorName
      ? `Live call coaching session with ${input.collectorName} completed. ${turns}`
      : `Live call coaching session completed. ${turns}`,
    occurredAt: input.endedAt,
    severity: "info",
  });
}

export function buildLiveCallInsightTimelineDrafts(
  insightDetails: LiveCallInsightDetail[],
  occurredAt: string,
): LiveCallTimelineEventDraft[] {
  return insightDetails.map((detail) =>
    baseDraft({
      eventType: INSIGHT_TO_TIMELINE_EVENT[detail.key],
      summary: detail.summary,
      occurredAt,
      severity: "attention",
      isLegalAttention: detail.key === "legal_language",
    }),
  );
}

export function buildLiveCallEndTimelineDrafts(input: {
  endedAt: string;
  collectorName: string | null;
  userTurnCount: number;
  insights: LiveCallInsights;
}): LiveCallTimelineEventDraft[] {
  const insightDetails = buildLiveCallInsightDetails(input.insights);

  return [
    buildLiveCallCompletedTimelineDraft({
      endedAt: input.endedAt,
      collectorName: input.collectorName,
      turnCount: input.userTurnCount,
    }),
    ...buildLiveCallInsightTimelineDrafts(insightDetails, input.endedAt),
  ];
}
