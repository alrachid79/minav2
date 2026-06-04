import type { LetterStatus, LetterType } from "@/types/letters";

export const LETTER_TYPE_LABELS: Record<LetterType, string> = {
  validation: "Debt Validation Letter",
  dispute: "Dispute Letter",
  cease_communication: "Cease Communication Letter",
  hardship: "Hardship Letter",
};

export const LETTER_TYPE_DESCRIPTIONS: Record<LetterType, string> = {
  validation:
    "Request verification details about an account before you decide how to respond.",
  dispute:
    "Explain that account details may be inaccurate and ask for clarification.",
  cease_communication:
    "Ask for written contact only while you review communications about an account.",
  hardship:
    "Describe financial hardship and ask that your situation be noted in their records.",
};

export const LETTER_EDUCATIONAL_DISCLAIMER =
  "Educational guidance only. This letter is not legal advice, does not describe your legal rights, and does not guarantee any outcome. Consider reviewing the final text carefully before sending.";

export const LETTER_STATUS_LABELS: Record<LetterStatus, string> = {
  draft: "Draft",
  finalized: "Finalized",
  exported: "Exported",
  sent: "Sent",
};

export const DEFAULT_RECIPIENT_NAME = "Account Review Department";
