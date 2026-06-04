import type { LiveCallTimelineEventType } from "@/lib/live-call/integration/constants";
import { LIVE_CALL_SOURCE_FEATURE } from "@/lib/live-call/integration/constants";

export function buildLiveCallTimelineEventTypeMarker(eventType: LiveCallTimelineEventType): string {
  return `mina_event_type:${eventType}`;
}

export function liveCallDescriptionIncludesEventType(
  description: string | null | undefined,
  eventType: LiveCallTimelineEventType,
): boolean {
  if (!description) {
    return false;
  }

  return description.includes(buildLiveCallTimelineEventTypeMarker(eventType));
}

export function buildLiveCallTimelineEventDescription(input: {
  eventType: LiveCallTimelineEventType;
  summary: string;
}): string {
  return `${buildLiveCallTimelineEventTypeMarker(input.eventType)}\n${input.summary}`;
}

export function getLiveCallTimelineSourceFeature(): string {
  return LIVE_CALL_SOURCE_FEATURE;
}
