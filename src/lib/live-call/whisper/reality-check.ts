import type { WhisperInformationTracker } from "@/lib/live-call/whisper/information-tracker";
import {
  formatMoneyValue,
  parseMoneyValue,
  type WhisperFinancialProfile,
} from "@/lib/live-call/whisper/financial-profile";
import type { ParsedCallInput } from "@/lib/live-call/whisper/parse-input";

export type RealityCheckClassification =
  | "likely_manageable"
  | "needs_review"
  | "may_create_financial_pressure"
  | "financial_profile_incomplete";

export interface WhisperRealityCheckResult {
  classification: RealityCheckClassification;
  verdict: string;
  offer_amount: string | null;
  monthly_amount: string | null;
  available_amount: string | null;
  available_label: "Available" | "Flexibility" | null;
}

export interface OfferAffordabilityAssessment {
  reality_check: WhisperRealityCheckResult | null;
  lump_sum_difficult: boolean;
  monthly_too_high: boolean;
  monthly_manageable: boolean;
}

function incompleteCheck(): WhisperRealityCheckResult {
  return {
    classification: "financial_profile_incomplete",
    verdict: "Needs review — financial profile incomplete.",
    offer_amount: null,
    monthly_amount: null,
    available_amount: null,
    available_label: null,
  };
}

function evaluateLumpSum(
  offerValue: number,
  profile: WhisperFinancialProfile,
  offerLabel: string,
): WhisperRealityCheckResult {
  if (!profile.is_complete) {
    return {
      ...incompleteCheck(),
      offer_amount: offerLabel,
    };
  }

  const available = profile.available_savings;

  if (offerValue > available + profile.emergency_fund) {
    return {
      classification: "may_create_financial_pressure",
      verdict: "May create financial pressure.",
      offer_amount: offerLabel,
      monthly_amount: null,
      available_amount: formatMoneyValue(available),
      available_label: "Available",
    };
  }

  if (offerValue > available) {
    return {
      classification: "may_create_financial_pressure",
      verdict: "Could reduce emergency protection.",
      offer_amount: offerLabel,
      monthly_amount: null,
      available_amount: formatMoneyValue(available),
      available_label: "Available",
    };
  }

  if (offerValue > available * 0.85) {
    return {
      classification: "needs_review",
      verdict: "Needs review against your savings.",
      offer_amount: offerLabel,
      monthly_amount: null,
      available_amount: formatMoneyValue(available),
      available_label: "Available",
    };
  }

  return {
    classification: "likely_manageable",
    verdict: "May be manageable.",
    offer_amount: offerLabel,
    monthly_amount: null,
    available_amount: formatMoneyValue(available),
    available_label: "Available",
  };
}

function evaluateMonthly(
  monthlyValue: number,
  profile: WhisperFinancialProfile,
  monthlyLabel: string,
): WhisperRealityCheckResult {
  if (!profile.is_complete) {
    return {
      ...incompleteCheck(),
      monthly_amount: monthlyLabel,
    };
  }

  const flexibility = profile.monthly_flexibility;

  if (monthlyValue > flexibility) {
    return {
      classification: "may_create_financial_pressure",
      verdict: "Monthly amount may be too high.",
      offer_amount: null,
      monthly_amount: monthlyLabel,
      available_amount: formatMoneyValue(flexibility),
      available_label: "Flexibility",
    };
  }

  return {
    classification: "likely_manageable",
    verdict: "May be manageable.",
    offer_amount: null,
    monthly_amount: monthlyLabel,
    available_amount: formatMoneyValue(flexibility),
    available_label: "Flexibility",
  };
}

export function assessOfferAffordability(input: {
  parsed: ParsedCallInput;
  tracker: WhisperInformationTracker;
  profile: WhisperFinancialProfile;
}): OfferAffordabilityAssessment {
  const { parsed, tracker, profile } = input;

  const lumpSumLabel = tracker.settlement_offer ?? parsed.settlementOfferAmount;
  const lumpSumValue = parseMoneyValue(lumpSumLabel);
  const monthlyLabel = tracker.monthly_payment_offer ?? parsed.monthlyPaymentAmount;
  const monthlyValue = parseMoneyValue(monthlyLabel);

  const hasMonthlyOffer =
    parsed.monthlyPaymentMention &&
    monthlyValue !== null &&
    !monthlyLabel?.toLowerCase().includes("discussed");

  if (hasMonthlyOffer) {
    const reality_check = evaluateMonthly(monthlyValue, profile, monthlyLabel!);
    return {
      reality_check,
      lump_sum_difficult: false,
      monthly_too_high: reality_check.verdict === "Monthly amount may be too high.",
      monthly_manageable: reality_check.classification === "likely_manageable",
    };
  }

  const hasLumpSumOffer =
    Boolean(lumpSumLabel) &&
    (parsed.settlementMention ||
      tracker.settlement_offer !== null ||
      parsed.settlementOfferAmount !== null);

  if (hasLumpSumOffer && lumpSumValue !== null) {
    const reality_check = evaluateLumpSum(lumpSumValue, profile, lumpSumLabel!);
    const lump_sum_difficult =
      reality_check.classification === "may_create_financial_pressure" ||
      reality_check.classification === "needs_review";

    return {
      reality_check,
      lump_sum_difficult,
      monthly_too_high: false,
      monthly_manageable: false,
    };
  }

  return {
    reality_check: null,
    lump_sum_difficult: false,
    monthly_too_high: false,
    monthly_manageable: false,
  };
}
