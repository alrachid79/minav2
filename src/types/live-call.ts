export const LIVE_CALL_SESSION_STATUSES = [
  "active",
  "paused",
  "completed",
  "discarded",
] as const;

export type LiveCallSessionStatus = (typeof LIVE_CALL_SESSION_STATUSES)[number];

export const LIVE_CALL_MESSAGE_ROLES = ["user", "mina"] as const;

export type LiveCallMessageRole = (typeof LIVE_CALL_MESSAGE_ROLES)[number];

export const LIVE_CALL_MESSAGE_TYPES = [
  "collector_input",
  "mina_response",
  "coaching",
] as const;

export type LiveCallMessageType = (typeof LIVE_CALL_MESSAGE_TYPES)[number];

export interface LiveCallUserMessageContent {
  text: string;
  notes: string | null;
}

export interface WhisperRealityCheckPayload {
  verdict: string;
  offer_amount: string | null;
  monthly_amount: string | null;
  available_amount: string | null;
  available_label: "Available" | "Flexibility" | null;
  classification:
    | "likely_manageable"
    | "needs_review"
    | "may_create_financial_pressure"
    | "financial_profile_incomplete";
}

export interface LiveCallMinaGuidanceContent {
  format: "whisper_v1" | "whisper_v2";
  stage: string;
  stage_code?: import("@/lib/live-call/whisper/stages").WhisperIntelligenceStage;
  say_now: string;
  captured: string[];
  missing: string[];
  pressure: "Low" | "Medium" | "High";
  reality_check?: WhisperRealityCheckPayload;
  tracker?: import("@/lib/live-call/whisper/information-tracker").WhisperInformationTracker;
}

/** @deprecated Legacy coaching payload — may exist on older sessions */
export interface LegacyLiveCallMinaGuidanceContent {
  suggested_response: string;
  clarifying_questions: string[];
  things_to_understand: string[];
  communication_guidance: string;
  what_is_happening: string;
  pressure_tactic: string | null;
  risk_level: "low" | "elevated" | "legal_attention";
  disclaimer: string;
}

export interface LiveCallMessageRecord {
  id: string;
  sequence_number: number;
  role: LiveCallMessageRole;
  message_type: LiveCallMessageType;
  content: LiveCallUserMessageContent | LiveCallMinaGuidanceContent | LegacyLiveCallMinaGuidanceContent;
  created_at: string;
}

export interface LiveCallSessionRecord {
  id: string;
  user_id: string;
  collector_id: string | null;
  debt_situation_id: string | null;
  status: LiveCallSessionStatus;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface LiveCallSummaryRecord {
  id: string;
  what_happened: string;
  important_points: string[] | null;
  risks: string[] | null;
  recommended_actions: string[] | null;
  next_step: string | null;
}

export interface LiveCallSessionSnapshot {
  session: LiveCallSessionRecord;
  messages: LiveCallMessageRecord[];
  summary: LiveCallSummaryRecord | null;
  collectorName: string | null;
}

export interface LiveCallSessionListItem {
  id: string;
  status: LiveCallSessionStatus;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  collector_name: string | null;
}

export type CreateLiveCallSessionResult =
  | { status: "success"; sessionId: string }
  | { status: "error"; message: string };

export type SubmitLiveCallInputResult =
  | { status: "success"; userSequence: number; minaSequence: number }
  | { status: "error"; message: string };

export type EndLiveCallSessionResult =
  | { status: "success"; summaryId: string }
  | { status: "error"; message: string };
