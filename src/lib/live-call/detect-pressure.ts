import type { LiveCallMinaGuidanceContent } from "@/types/live-call";

export interface PressureDetectionResult {
  tactic: string | null;
  riskLevel: LiveCallMinaGuidanceContent["risk_level"];
  legalLanguage: boolean;
  urgencyLanguage: boolean;
  paymentDemand: boolean;
  settlementLanguage: boolean;
  validationLanguage: boolean;
}

const PRESSURE_PHRASES: Array<{ phrase: string; tactic: string }> = [
  { phrase: "pay today", tactic: "Immediate payment pressure" },
  { phrase: "right now", tactic: "Urgency pressure" },
  { phrase: "final notice", tactic: "Final notice framing" },
  { phrase: "legal action", tactic: "Legal action threat language" },
  { phrase: "sue you", tactic: "Lawsuit threat language" },
  { phrase: "garnish", tactic: "Garnishment threat language" },
  { phrase: "wage garnishment", tactic: "Wage garnishment threat language" },
  { phrase: "arrest", tactic: "Arrest threat language" },
  { phrase: "must pay", tactic: "Mandatory payment framing" },
  { phrase: "only option", tactic: "Limited-options framing" },
  { phrase: "today only", tactic: "Time-limited offer pressure" },
];

const LEGAL_PHRASES = [
  "lawsuit",
  "summons",
  "court",
  "attorney",
  "garnishment",
  "judgment",
  "legal action",
];

const SETTLEMENT_PHRASES = [
  "settlement",
  "settle for",
  "offer to settle",
  "lump sum",
  "payment plan",
];

const VALIDATION_PHRASES = [
  "verify the debt",
  "validate",
  "prove the debt",
  "send proof",
];

function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

export function detectCallPressure(normalizedText: string): PressureDetectionResult {
  let tactic: string | null = null;

  for (const rule of PRESSURE_PHRASES) {
    if (normalizedText.includes(rule.phrase)) {
      tactic = rule.tactic;
      break;
    }
  }

  const legalLanguage = includesAny(normalizedText, LEGAL_PHRASES);
  const settlementLanguage = includesAny(normalizedText, SETTLEMENT_PHRASES);
  const validationLanguage = includesAny(normalizedText, VALIDATION_PHRASES);
  const urgencyLanguage =
    normalizedText.includes("today") ||
    normalizedText.includes("immediately") ||
    normalizedText.includes("deadline");
  const paymentDemand =
    normalizedText.includes("pay") ||
    normalizedText.includes("payment") ||
    normalizedText.includes("amount due");

  let riskLevel: PressureDetectionResult["riskLevel"] = "low";

  if (legalLanguage || tactic?.includes("Garnishment") || tactic?.includes("Lawsuit")) {
    riskLevel = "legal_attention";
  } else if (tactic || urgencyLanguage || paymentDemand) {
    riskLevel = "elevated";
  }

  return {
    tactic,
    riskLevel,
    legalLanguage,
    urgencyLanguage,
    paymentDemand,
    settlementLanguage,
    validationLanguage,
  };
}

export function normalizeCallInput(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}
