import type { OfferAffordabilityAssessment } from "@/lib/live-call/whisper/reality-check";
import type { WhisperInformationTracker } from "@/lib/live-call/whisper/information-tracker";
import type { ParsedCallInput } from "@/lib/live-call/whisper/parse-input";
import type { WhisperIntelligenceStage } from "@/lib/live-call/whisper/stages";

export type ConversationObjective =
  | "collector_name"
  | "account_reference"
  | "balance"
  | "settlement_offer"
  | "monthly_payment_offer"
  | "deadline"
  | "written_offer_received";

export const OBJECTIVE_PRIORITY: ConversationObjective[] = [
  "collector_name",
  "account_reference",
  "balance",
  "settlement_offer",
  "monthly_payment_offer",
  "deadline",
  "written_offer_received",
];

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

function isObjectiveMissing(
  tracker: WhisperInformationTracker,
  objective: ConversationObjective,
): boolean {
  if (objective === "written_offer_received") {
    return !tracker.written_offer_received;
  }

  return !tracker[objective];
}

export function getNextMissingObjective(
  tracker: WhisperInformationTracker,
): ConversationObjective | null {
  for (const objective of OBJECTIVE_PRIORITY) {
    if (objective === "account_reference" && tracker.balance) {
      continue;
    }

    if (isObjectiveMissing(tracker, objective)) {
      return objective;
    }
  }

  return null;
}

export function listMissingObjectivesInPriorityOrder(
  tracker: WhisperInformationTracker,
): ConversationObjective[] {
  return OBJECTIVE_PRIORITY.filter((objective) => {
    if (objective === "account_reference" && tracker.balance) {
      return false;
    }

    return isObjectiveMissing(tracker, objective);
  });
}

function sayNowForObjective(
  objective: ConversationObjective,
  tracker: WhisperInformationTracker,
  affordability: OfferAffordabilityAssessment,
): string {
  switch (objective) {
    case "collector_name":
      return "Can I get your name and company, please?";
    case "account_reference":
      return "What account is this regarding?";
    case "balance":
      return "Can you confirm the balance you're referencing?";
    case "settlement_offer":
      return tracker.balance ? "What options are available?" : "Can you explain the offer in more detail?";
    case "monthly_payment_offer":
      if (affordability.monthly_too_high) {
        return "Is there a lower monthly option available?";
      }
      if (tracker.monthly_payment_offer) {
        return "Can you send the payment plan terms in writing?";
      }
      if (tracker.settlement_offer && affordability.lump_sum_difficult && !tracker.monthly_payments_asked) {
        return "Are monthly payments available for that offer?";
      }
      return "Are monthly payments available for that offer?";
    case "deadline":
      return "Can the deadline be extended?";
    case "written_offer_received":
      return "Can you send that in writing?";
    default:
      return "Can you send that in writing?";
  }
}

function buildLegalOverride(parsed: ParsedCallInput, stage: WhisperIntelligenceStage): string | null {
  if (stage !== "LEGAL_THREAT" && !parsed.legalThreat) {
    return null;
  }

  if (parsed.lawsuitMention || parsed.normalized.includes("lawsuit filed")) {
    return "Do you have the case number available?";
  }

  if (parsed.garnishmentMention) {
    return "Can you send that garnishment claim in writing?";
  }

  return "Can you send the legal details in writing?";
}

function buildPressureOverride(input: {
  parsed: ParsedCallInput;
  tracker: WhisperInformationTracker;
  affordability: OfferAffordabilityAssessment;
  stage: WhisperIntelligenceStage;
}): string | null {
  const { parsed, tracker, affordability, stage } = input;

  if (parsed.noMonthlyPayments) {
    return "I need time to review before making a decision.";
  }

  if (parsed.paymentDemand) {
    return "I need time to review before making a decision.";
  }

  if (stage === "DEADLINE_PRESSURE" || parsed.expiresToday || parsed.deadline === "Today") {
    if (parsed.expiresToday || parsed.deadline === "Today") {
      return "Can the deadline be extended?";
    }
  }

  if (
    tracker.settlement_offer &&
    affordability.lump_sum_difficult &&
    !tracker.monthly_payments_asked &&
    !tracker.monthly_payment_offer &&
    (parsed.settlementMention || stage === "SETTLEMENT_OFFER" || stage === "DEADLINE_PRESSURE")
  ) {
    return "Are monthly payments available for that offer?";
  }

  if (affordability.monthly_too_high && (parsed.monthlyPaymentMention || tracker.monthly_payment_offer)) {
    return "Is there a lower monthly option available?";
  }

  return null;
}

export function buildConversationResponse(input: {
  stage: WhisperIntelligenceStage;
  parsed: ParsedCallInput;
  tracker: WhisperInformationTracker;
  affordability: OfferAffordabilityAssessment;
}): string {
  const legalOverride = buildLegalOverride(input.parsed, input.stage);
  if (legalOverride) {
    return clampSayNow(legalOverride);
  }

  const pressureOverride = buildPressureOverride(input);
  if (pressureOverride) {
    return clampSayNow(pressureOverride);
  }

  if (input.stage === "WRAP_UP") {
    return clampSayNow("Can you send that in writing?");
  }

  if (input.parsed.monthlyPaymentMention && input.tracker.monthly_payment_offer && !input.tracker.written_offer_received) {
    return clampSayNow("Can you send the payment plan terms in writing?");
  }

  const nextObjective = getNextMissingObjective(input.tracker);

  if (!nextObjective) {
    return clampSayNow("Can you send that in writing?");
  }

  return clampSayNow(sayNowForObjective(nextObjective, input.tracker, input.affordability));
}
