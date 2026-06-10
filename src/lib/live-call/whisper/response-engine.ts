import type { OfferAffordabilityAssessment } from "@/lib/live-call/whisper/reality-check";
import type { WhisperInformationTracker } from "@/lib/live-call/whisper/information-tracker";
import type { ParsedCallInput } from "@/lib/live-call/whisper/parse-input";
import type { WhisperIntelligenceStage } from "@/lib/live-call/whisper/stages";

const SAY_NOW_MAX_LENGTH = 120;

function clampSayNow(sentence: string): string {
  const trimmed = sentence.trim().replace(/\s+/g, " ");

  if (trimmed.length <= SAY_NOW_MAX_LENGTH) {
    return trimmed;
  }

  const cut = trimmed.slice(0, SAY_NOW_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : SAY_NOW_MAX_LENGTH - 1).trim()}…`;
}

export function buildStageResponse(input: {
  stage: WhisperIntelligenceStage;
  parsed: ParsedCallInput;
  tracker: WhisperInformationTracker;
  affordability: OfferAffordabilityAssessment;
}): string {
  const { stage, parsed, tracker, affordability } = input;

  if (stage === "PAYMENT_PLAN") {
    if (affordability.monthly_too_high) {
      return clampSayNow("Is there a lower monthly option available?");
    }
    if (parsed.monthlyPaymentAmount || tracker.monthly_payment_offer) {
      return clampSayNow("Can you send the payment plan terms in writing?");
    }
    return clampSayNow("What would the monthly amount and term be?");
  }

  if (stage === "DEADLINE_PRESSURE") {
    if (parsed.noMonthlyPayments) {
      return clampSayNow("I need time to review before making a decision.");
    }
    if (parsed.paymentDemand) {
      return clampSayNow("I need time to review before making a decision.");
    }
    if (parsed.expiresToday || parsed.deadline === "Today") {
      return clampSayNow("Can the deadline be extended?");
    }
    if (
      affordability.lump_sum_difficult &&
      (parsed.settlementMention || parsed.settlementOfferAmount || tracker.settlement_offer) &&
      !tracker.monthly_payments_asked
    ) {
      return clampSayNow("Are monthly payments available for that offer?");
    }
    return clampSayNow("Can the deadline be extended?");
  }

  switch (stage) {
    case "IDENTITY_VERIFICATION":
      return clampSayNow("Can I get your name and company, please?");

    case "ACCOUNT_DISCUSSION":
      if (!tracker.account_reference) {
        return clampSayNow("Which account is this regarding?");
      }
      return clampSayNow("Can you confirm the balance you're referencing?");

    case "SETTLEMENT_OFFER":
      if (parsed.noMonthlyPayments) {
        return clampSayNow("I need time to review before making a decision.");
      }
      if (affordability.lump_sum_difficult && !tracker.monthly_payments_asked) {
        return clampSayNow("Are monthly payments available for that offer?");
      }
      if (tracker.settlement_offer || parsed.settlementOfferAmount) {
        return clampSayNow("Are monthly payments available for that offer?");
      }
      return clampSayNow("Can you explain the offer in more detail?");

    case "LEGAL_THREAT":
      if (parsed.lawsuitMention || parsed.normalized.includes("lawsuit filed")) {
        return clampSayNow("Do you have the case number available?");
      }
      if (parsed.garnishmentMention) {
        return clampSayNow("Can you send that garnishment claim in writing?");
      }
      return clampSayNow("Can you send the legal details in writing?");

    case "WRAP_UP":
      return clampSayNow("Can you send that in writing?");

    default:
      return clampSayNow("Can you send that in writing?");
  }
}

export function markResponseAsked(
  tracker: WhisperInformationTracker,
  sayNow: string,
): WhisperInformationTracker {
  if (sayNow.toLowerCase().includes("monthly payments") || sayNow.toLowerCase().includes("monthly option")) {
    return { ...tracker, monthly_payments_asked: true };
  }

  return tracker;
}
