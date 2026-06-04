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

export interface LiveCallMinaGuidanceContent {
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
  content: LiveCallUserMessageContent | LiveCallMinaGuidanceContent;
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
