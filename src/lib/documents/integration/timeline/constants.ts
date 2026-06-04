export const TIMELINE_EVENT_TYPES = [
  "document_uploaded",
  "document_analyzed",
  "document_confirmed",
  "document_integrated",
  "deadline_detected",
  "settlement_offer_detected",
  "court_notice_detected",
  "irs_notice_detected",
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const TIMELINE_EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  document_uploaded: "Document uploaded",
  document_analyzed: "Document analyzed",
  document_confirmed: "Document confirmed",
  document_integrated: "Document integrated",
  deadline_detected: "Deadline detected",
  settlement_offer_detected: "Settlement offer detected",
  court_notice_detected: "Court notice detected",
  irs_notice_detected: "IRS notice detected",
};

export const TIMELINE_SEVERITIES = ["info", "attention"] as const;

export type TimelineEventSeverity = (typeof TIMELINE_SEVERITIES)[number];

export const DOCUMENT_ANALYSIS_SOURCE_FEATURE = "document_analysis";

export function buildTimelineEventTypeMarker(eventType: TimelineEventType): string {
  return `mina_event_type:${eventType}`;
}

export function descriptionIncludesEventType(
  description: string | null | undefined,
  eventType: TimelineEventType,
): boolean {
  if (!description) {
    return false;
  }

  return description.includes(buildTimelineEventTypeMarker(eventType));
}

export function buildTimelineEventDescription(input: {
  eventType: TimelineEventType;
  summary: string;
}): string {
  return `${buildTimelineEventTypeMarker(input.eventType)}\n${input.summary}`;
}
