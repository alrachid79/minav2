import "server-only";

import type { BuiltLiveCallSummary } from "@/lib/live-call/build-summary";
import {
  detectCallPressure,
  normalizeCallInput,
} from "@/lib/live-call/detect-pressure";
import type { LiveCallInsightKey } from "@/lib/live-call/integration/constants";
import { LIVE_CALL_INSIGHT_KEYS } from "@/lib/live-call/integration/constants";
import type {
  LiveCallMessageRecord,
  LiveCallMinaGuidanceContent,
  LiveCallUserMessageContent,
} from "@/types/live-call";

export interface LiveCallInsights {
  urgency_language: boolean;
  payment_pressure: boolean;
  legal_language: boolean;
  deadline_mention: boolean;
  information_request: boolean;
}

export interface LiveCallInsightDetail {
  key: LiveCallInsightKey;
  summary: string;
}

const DEADLINE_PHRASES = [
  "deadline",
  "due date",
  "due by",
  "by tomorrow",
  "by friday",
  "by monday",
  "within 24",
  "within 48",
  "within 7 days",
  "respond by",
  "must respond",
  "last chance",
  "final date",
];

const INFORMATION_REQUEST_PHRASES = [
  "send in writing",
  "in writing",
  "written confirmation",
  "verify",
  "validation",
  "proof of",
  "account reference",
  "account number",
  "file number",
  "reference number",
  "mail you",
  "email you",
  "documentation",
  "send me",
];

function isMinaGuidance(
  content: LiveCallUserMessageContent | LiveCallMinaGuidanceContent,
): content is LiveCallMinaGuidanceContent {
  return "suggested_response" in content;
}

function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

export function collectLiveCallSourceText(input: {
  messages: LiveCallMessageRecord[];
  summary: BuiltLiveCallSummary;
}): string {
  const parts: string[] = [input.summary.what_happened];

  for (const point of input.summary.important_points) {
    parts.push(point);
  }

  for (const risk of input.summary.risks) {
    parts.push(risk);
  }

  for (const message of input.messages) {
    if (message.role === "user") {
      const content = message.content as LiveCallUserMessageContent;
      parts.push(content.text);
      if (content.notes) {
        parts.push(content.notes);
      }
      continue;
    }

    if (isMinaGuidance(message.content)) {
      parts.push(message.content.what_is_happening);
      if (message.content.pressure_tactic) {
        parts.push(message.content.pressure_tactic);
      }
    }
  }

  return parts.join(" ");
}

export function extractLiveCallInsights(input: {
  messages: LiveCallMessageRecord[];
  summary: BuiltLiveCallSummary;
}): LiveCallInsights {
  const normalized = normalizeCallInput(collectLiveCallSourceText(input));
  const detection = detectCallPressure(normalized);

  const urgency_language =
    detection.urgencyLanguage ||
    detection.tactic !== null ||
    normalized.includes("urgent") ||
    normalized.includes("right away");

  const payment_pressure =
    detection.paymentDemand ||
    detection.settlementLanguage ||
    normalized.includes("pay now") ||
    normalized.includes("payment today");

  const legal_language =
    detection.legalLanguage || detection.riskLevel === "legal_attention";

  const deadline_mention = includesAny(normalized, DEADLINE_PHRASES);

  const information_request = includesAny(normalized, INFORMATION_REQUEST_PHRASES);

  return {
    urgency_language,
    payment_pressure,
    legal_language,
    deadline_mention,
    information_request,
  };
}

const INSIGHT_SUMMARIES: Record<LiveCallInsightKey, string> = {
  urgency_language: "Urgency or time-pressure language was noted during the call.",
  payment_pressure: "Payment or settlement pressure language was noted during the call.",
  legal_language: "Legal-sounding language was noted during the call.",
  deadline_mention: "A deadline or time limit was mentioned during the call.",
  information_request: "The caller requested information or written follow-up during the call.",
};

export function buildLiveCallInsightDetails(insights: LiveCallInsights): LiveCallInsightDetail[] {
  const details: LiveCallInsightDetail[] = [];

  for (const key of LIVE_CALL_INSIGHT_KEYS) {
    if (insights[key]) {
      details.push({
        key,
        summary: INSIGHT_SUMMARIES[key],
      });
    }
  }

  return details;
}

export function hasAnyLiveCallInsight(insights: LiveCallInsights): boolean {
  return LIVE_CALL_INSIGHT_KEYS.some((key) => insights[key]);
}
