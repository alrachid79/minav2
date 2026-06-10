import type { ParsedCallInput } from "@/lib/live-call/whisper/parse-input";
import type { WhisperInformationTracker } from "@/lib/live-call/whisper/information-tracker";
import type { WhisperIntelligenceStage } from "@/lib/live-call/whisper/stages";

export function detectIntelligenceStage(input: {
  parsed: ParsedCallInput;
  turnNumber: number;
  tracker: WhisperInformationTracker;
}): WhisperIntelligenceStage {
  const { parsed, turnNumber, tracker } = input;

  if (parsed.wrapUpMention && turnNumber > 1) {
    return "WRAP_UP";
  }

  if (
    parsed.legalThreat ||
    parsed.lawsuitMention ||
    parsed.garnishmentMention ||
    parsed.courtMention
  ) {
    return "LEGAL_THREAT";
  }

  if (
    parsed.expiresToday ||
    parsed.paymentDemand ||
    (parsed.deadline !== null && (parsed.settlementMention || tracker.settlement_offer))
  ) {
    return "DEADLINE_PRESSURE";
  }

  if (parsed.noMonthlyPayments && tracker.settlement_offer) {
    return "DEADLINE_PRESSURE";
  }

  if (parsed.monthlyPaymentMention && !parsed.settlementMention) {
    return "PAYMENT_PLAN";
  }

  if (parsed.settlementMention || parsed.settlementOfferAmount || tracker.settlement_offer) {
    return "SETTLEMENT_OFFER";
  }

  if (parsed.accountMention || tracker.balance || tracker.account_reference) {
    return "ACCOUNT_DISCUSSION";
  }

  if (!tracker.collector_name && (turnNumber <= 1 || parsed.identityMention)) {
    return "IDENTITY_VERIFICATION";
  }

  return tracker.current_stage;
}

export function updateTrackerFromInput(
  tracker: WhisperInformationTracker,
  parsed: ParsedCallInput,
  stage: WhisperIntelligenceStage,
): WhisperInformationTracker {
  return {
    ...tracker,
    collector_name: tracker.collector_name ?? parsed.collectorName,
    creditor_name: tracker.creditor_name ?? parsed.creditorName,
    balance: tracker.balance ?? parsed.balanceAmount ?? null,
    settlement_offer:
      parsed.settlementOfferAmount ??
      tracker.settlement_offer ??
      (parsed.settlementMention && parsed.dollarAmounts[0] ? parsed.dollarAmounts[0] : null),
    monthly_payment_offer:
      parsed.monthlyPaymentAmount ??
      (parsed.monthlyPaymentMention ? tracker.monthly_payment_offer : null),
    deadline: parsed.deadline ?? tracker.deadline,
    account_reference: tracker.account_reference ?? parsed.accountReference,
    written_offer_received:
      tracker.written_offer_received || parsed.writtenOfferMention,
    current_stage: stage,
  };
}
