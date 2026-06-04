import "server-only";

import {
  INSIGHT_TO_RECOMMENDATION_KEY,
  LIVE_CALL_RECOMMENDATION_URGENCY_ORDER,
  type LiveCallInsightKey,
  type LiveCallRecommendationKey,
} from "@/lib/live-call/integration/constants";
import type { LiveCallInsights } from "@/lib/live-call/integration/extract-insights";

export interface LiveCallRecommendationDraft {
  recommendationKey: LiveCallRecommendationKey;
  title: string;
  reason: string;
  targetFeature: string;
  urgencyOrder: number;
}

const RECOMMENDATION_COPY: Record<
  LiveCallRecommendationKey,
  { title: string; reason: string }
> = {
  urgency_review: {
    title: "Consider reviewing the information before making a decision.",
    reason:
      "Your recent call coaching session included urgency or time-pressure language. Take time to review before responding.",
  },
  payment_pressure_review: {
    title: "Review payment language carefully before responding.",
    reason:
      "Your recent call included payment or settlement pressure. Review any details in writing before deciding next steps.",
  },
  legal_language_review: {
    title: "Review legal-sounding statements when you have time.",
    reason:
      "Your recent call included legal-sounding language. Review written details carefully before acting.",
  },
  deadline_review: {
    title: "Review any deadlines carefully and keep records.",
    reason:
      "Your recent call mentioned a deadline or time limit. Review dates and keep records of what was said.",
  },
  information_request_review: {
    title: "Keep records of what information was requested.",
    reason:
      "Your recent call included requests for information or written follow-up. Note what was asked and what you requested in writing.",
  },
};

function buildDraft(recommendationKey: LiveCallRecommendationKey): LiveCallRecommendationDraft {
  const copy = RECOMMENDATION_COPY[recommendationKey];

  return {
    recommendationKey,
    title: copy.title,
    reason: copy.reason,
    targetFeature: "live_call",
    urgencyOrder: LIVE_CALL_RECOMMENDATION_URGENCY_ORDER[recommendationKey],
  };
}

const INSIGHT_PRIORITY: LiveCallInsightKey[] = [
  "legal_language",
  "deadline_mention",
  "urgency_language",
  "payment_pressure",
  "information_request",
];

export function buildLiveCallRecommendationDrafts(
  insights: LiveCallInsights,
): LiveCallRecommendationDraft[] {
  const drafts: LiveCallRecommendationDraft[] = [];

  for (const insightKey of INSIGHT_PRIORITY) {
    if (!insights[insightKey]) {
      continue;
    }

    drafts.push(buildDraft(INSIGHT_TO_RECOMMENDATION_KEY[insightKey]));
  }

  return drafts.sort((left, right) => left.urgencyOrder - right.urgencyOrder);
}

export function assignLiveCallRecommendationPriorities(
  drafts: LiveCallRecommendationDraft[],
): Array<LiveCallRecommendationDraft & { priority: "primary" | "secondary"; sortOrder: number }> {
  if (drafts.length === 0) {
    return [];
  }

  return drafts.map((draft, index) => ({
    ...draft,
    priority: index === 0 ? "primary" : "secondary",
    sortOrder: index + 1,
  }));
}
