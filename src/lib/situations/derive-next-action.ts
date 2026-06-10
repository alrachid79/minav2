import type { SituationFinancialSignals } from "@/types/situations";

interface RecommendationInput {
  title: string;
  reason: string;
}

export function deriveSituationNextAction(input: {
  signals: SituationFinancialSignals;
  recommendation: RecommendationInput | null;
  hasWrittenTerms: boolean;
  hasUpcomingDeadline: boolean;
  hasLegalAttention: boolean;
}): string {
  const { signals, recommendation, hasWrittenTerms, hasUpcomingDeadline, hasLegalAttention } =
    input;

  if (recommendation?.title) {
    return recommendation.title.endsWith(".")
      ? recommendation.title
      : `${recommendation.title}.`;
  }

  if (hasLegalAttention || signals.pressure === "High") {
    return "Check legal deadline.";
  }

  if (signals.latestOffer && !hasWrittenTerms) {
    return "Review written terms before deciding.";
  }

  if (
    signals.latestOffer &&
    signals.realityCheck?.classification === "may_create_financial_pressure"
  ) {
    return "Ask whether monthly payments are available.";
  }

  if (signals.latestOffer && signals.realityCheck?.classification === "needs_review") {
    return "Review the offer against your budget before deciding.";
  }

  if (hasUpcomingDeadline || signals.deadline) {
    return "Check the deadline.";
  }

  if (signals.paymentTerms) {
    return "Review payment plan terms in writing.";
  }

  return "Review your situation details.";
}
