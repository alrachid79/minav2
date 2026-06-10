export const WHISPER_INTELLIGENCE_STAGES = [
  "IDENTITY_VERIFICATION",
  "ACCOUNT_DISCUSSION",
  "SETTLEMENT_OFFER",
  "PAYMENT_PLAN",
  "DEADLINE_PRESSURE",
  "LEGAL_THREAT",
  "WRAP_UP",
] as const;

export type WhisperIntelligenceStage = (typeof WHISPER_INTELLIGENCE_STAGES)[number];

export const WHISPER_PRESSURE_LEVELS = ["Low", "Medium", "High"] as const;

export type WhisperPressureLevel = (typeof WHISPER_PRESSURE_LEVELS)[number];

export const STAGE_LABELS: Record<WhisperIntelligenceStage, string> = {
  IDENTITY_VERIFICATION: "Identity Verification",
  ACCOUNT_DISCUSSION: "Account Discussion",
  SETTLEMENT_OFFER: "Settlement Offer",
  PAYMENT_PLAN: "Payment Plan",
  DEADLINE_PRESSURE: "Deadline Pressure",
  LEGAL_THREAT: "Legal Threat",
  WRAP_UP: "Wrap Up",
};

/** @deprecated V1 stage names — kept for legacy sessions */
export const WHISPER_CALL_STAGES = [
  "Caller Identification",
  "Account Identification",
  "Balance Discussion",
  "Settlement Offer Mentioned",
  "Settlement Details Known",
  "Monthly Payment Discussion",
  "Payment Pressure",
  "Legal Mention",
  "Call Closing",
] as const;

export type WhisperCallStage = (typeof WHISPER_CALL_STAGES)[number];
