import { LIVE_CALL_SOURCE_FEATURE } from "@/lib/live-call/constants";

export { LIVE_CALL_SOURCE_FEATURE };

export const LIVE_CALL_DASHBOARD_SOURCE_FEATURE = LIVE_CALL_SOURCE_FEATURE;

export const LIVE_CALL_TIMELINE_EVENT_TYPES = [
  "call_started",
  "call_completed",
  "call_insight_urgency",
  "call_insight_payment_pressure",
  "call_insight_legal_language",
  "call_insight_deadline",
  "call_insight_information_request",
] as const;

export type LiveCallTimelineEventType = (typeof LIVE_CALL_TIMELINE_EVENT_TYPES)[number];

export const LIVE_CALL_TIMELINE_EVENT_LABELS: Record<LiveCallTimelineEventType, string> = {
  call_started: "Call started",
  call_completed: "Call completed",
  call_insight_urgency: "Important call insight detected",
  call_insight_payment_pressure: "Important call insight detected",
  call_insight_legal_language: "Important call insight detected",
  call_insight_deadline: "Important call insight detected",
  call_insight_information_request: "Important call insight detected",
};

export const LIVE_CALL_INSIGHT_KEYS = [
  "urgency_language",
  "payment_pressure",
  "legal_language",
  "deadline_mention",
  "information_request",
] as const;

export type LiveCallInsightKey = (typeof LIVE_CALL_INSIGHT_KEYS)[number];

export const LIVE_CALL_RECOMMENDATION_KEYS = [
  "urgency_review",
  "payment_pressure_review",
  "legal_language_review",
  "deadline_review",
  "information_request_review",
] as const;

export type LiveCallRecommendationKey = (typeof LIVE_CALL_RECOMMENDATION_KEYS)[number];

export const LIVE_CALL_RECOMMENDATION_URGENCY_ORDER: Record<LiveCallRecommendationKey, number> =
  {
    legal_language_review: 1,
    deadline_review: 2,
    urgency_review: 3,
    payment_pressure_review: 4,
    information_request_review: 5,
  };

export const INSIGHT_TO_TIMELINE_EVENT: Record<
  LiveCallInsightKey,
  LiveCallTimelineEventType
> = {
  urgency_language: "call_insight_urgency",
  payment_pressure: "call_insight_payment_pressure",
  legal_language: "call_insight_legal_language",
  deadline_mention: "call_insight_deadline",
  information_request: "call_insight_information_request",
};

export const INSIGHT_TO_RECOMMENDATION_KEY: Record<
  LiveCallInsightKey,
  LiveCallRecommendationKey
> = {
  urgency_language: "urgency_review",
  payment_pressure: "payment_pressure_review",
  legal_language: "legal_language_review",
  deadline_mention: "deadline_review",
  information_request: "information_request_review",
};
