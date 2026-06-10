import { buildConversationResponse } from "@/lib/live-call/whisper/conversation-state-engine";
import type { OfferAffordabilityAssessment } from "@/lib/live-call/whisper/reality-check";
import type { WhisperInformationTracker } from "@/lib/live-call/whisper/information-tracker";
import type { ParsedCallInput } from "@/lib/live-call/whisper/parse-input";
import type { WhisperIntelligenceStage } from "@/lib/live-call/whisper/stages";

export function buildStageResponse(input: {
  stage: WhisperIntelligenceStage;
  parsed: ParsedCallInput;
  tracker: WhisperInformationTracker;
  affordability: OfferAffordabilityAssessment;
}): string {
  return buildConversationResponse(input);
}

export function markResponseAsked(
  tracker: WhisperInformationTracker,
  sayNow: string,
): WhisperInformationTracker {
  if (
    sayNow.toLowerCase().includes("monthly payments") ||
    sayNow.toLowerCase().includes("monthly option")
  ) {
    return { ...tracker, monthly_payments_asked: true };
  }

  return tracker;
}
