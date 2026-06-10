export const PRODUCT_EVENTS = {
  WHISPER_MODE_STARTED: "whisper_mode_started",
  WHISPER_MODE_COMPLETED: "whisper_mode_completed",
  SITUATION_OPENED: "situation_opened",
  RECOVERY_PLAN_OPENED: "recovery_plan_opened",
  DOCUMENT_UPLOADED: "document_uploaded",
  LETTER_GENERATED: "letter_generated",
} as const;

export type ProductEventType = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS];
