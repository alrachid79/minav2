/**
 * Onboarding types for Mina V2 Phase 2.
 * Aligned with MINA_ONBOARDING_EXPERIENCE.md and MINA_DATABASE_MVP.md.
 */

export const ONBOARDING_SESSION_VERSION = 1 as const;

export const GUEST_SESSION_TTL_DAYS = 7;

export const ONBOARDING_STEP_KEYS = [
  "current_situation",
  "situation_type",
  "severity",
  "financial_snapshot",
  "stress_profile",
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEP_KEYS)[number];

export type OnboardingTransferStatus = "pending" | "completed" | null;

/** First screen — what brought you here today? */
export type CurrentSituationReason =
  | "collector_contacted"
  | "letter_received"
  | "worried_about_debt"
  | "behind_on_payments"
  | "facing_legal_action"
  | "not_sure_where_to_start";

export type SituationTypeCategory =
  | "credit_card"
  | "medical"
  | "personal_loan"
  | "auto_loan"
  | "student_loans"
  | "mortgage"
  | "irs_tax"
  | "utilities"
  | "collections_unknown"
  | "multiple_debts"
  | "not_sure";

export type YesNoNotSure = "yes" | "no" | "not_sure";

export type LetterAboutType =
  | "payment_demand"
  | "court_or_legal"
  | "verification_or_validation"
  | "not_sure"
  | "not_opened_yet";

export type CollectorContactFrequency =
  | "once"
  | "a_few_times"
  | "frequently"
  | "not_sure";

export type LawsuitFollowUp =
  | "served"
  | "court_date_known"
  | "heard_not_sure"
  | "not_sure";

export type WageBankEffect =
  | "yes_garnishment_or_levy"
  | "yes_unsure_type"
  | "no"
  | "not_sure";

export type DeadlineWindow =
  | "within_2_weeks"
  | "within_30_days"
  | "more_than_30_days"
  | "not_sure";

export type UncertaintyFlag =
  | "who_is_contacting"
  | "whether_i_owe"
  | "what_if_ignore"
  | "whether_legitimate"
  | "what_to_do_first"
  | "none_mostly_understand";

export type IncomeRange =
  | "under_2000"
  | "2000_4000"
  | "4000_6000"
  | "6000_10000"
  | "over_10000"
  | "prefer_not_to_say";

export type ExpenseRange = IncomeRange;

export type EmergencySavingsFeel =
  | "very_difficult"
  | "manageable_but_tight"
  | "comfortable"
  | "prefer_not_to_say";

export type DebtSituationCount =
  | "one"
  | "two_to_three"
  | "four_or_more"
  | "not_sure";

export type StressSliderValue = 1 | 2 | 3 | 4 | 5;

export type BehaviorPattern = "avoider" | "analyzer" | "reactor" | "freezer";

export type SupportStyle =
  | "coach"
  | "direct"
  | "emotional_first"
  | "educator"
  | "accountability";

export type RecoveryGoal =
  | "stop_worrying"
  | "respond_confidently"
  | "settle_or_negotiate"
  | "avoid_legal_problems"
  | "create_a_plan"
  | "rebuild_stability";

export type StressIntensity = "low" | "medium" | "high" | "critical";

export type LegalRiskLevel = "low" | "medium" | "high" | "legal_attention";

export type RecoveryStage =
  | "stabilize"
  | "understand"
  | "protect"
  | "act"
  | "resolve"
  | "recover";

export type MemoryCategory =
  | "communication_preference"
  | "fear_pattern"
  | "behavioral_pattern"
  | "coaching_insight";

export interface OnboardingConsents {
  data_storage: boolean;
  guidance_disclaimer: boolean;
}

export interface CurrentSituationAnswer {
  reason: CurrentSituationReason;
}

export interface SituationTypeFollowUp {
  category: SituationTypeCategory;
  response: string;
}

export interface SituationTypeAnswer {
  categories: SituationTypeCategory[];
  follow_ups: SituationTypeFollowUp[];
  most_urgent?: SituationTypeCategory;
}

export interface SeverityAnswer {
  received_letter: YesNoNotSure;
  letter_about?: LetterAboutType;
  collector_contact: YesNoNotSure;
  collector_contact_frequency?: CollectorContactFrequency;
  currently_sued: YesNoNotSure;
  lawsuit_follow_up?: LawsuitFollowUp;
  wages_or_bank_affected: WageBankEffect;
  upcoming_deadlines: YesNoNotSure;
  deadline_window?: DeadlineWindow;
  uncertainty_flags: UncertaintyFlag[];
}

export interface FinancialSnapshotAnswer {
  us_state: string;
  income_range: IncomeRange;
  expense_range: ExpenseRange;
  emergency_savings_feel: EmergencySavingsFeel;
  debt_situation_count: DebtSituationCount;
}

export interface StressProfileAnswer {
  emotional_pressure: StressSliderValue;
  financial_pressure: StressSliderValue;
  legal_pressure: StressSliderValue;
  confidence_level: StressSliderValue;
  behavior_pattern: BehaviorPattern;
  support_style: SupportStyle;
  recovery_goals: RecoveryGoal[];
}

export interface OnboardingAnswers {
  current_situation?: CurrentSituationAnswer;
  situation_type?: SituationTypeAnswer;
  severity?: SeverityAnswer;
  financial_snapshot?: FinancialSnapshotAnswer;
  stress_profile?: StressProfileAnswer;
}

export interface PressureProfile {
  pressure_sources: string[];
  stress_intensity: StressIntensity;
  stress_label: string;
  behavior_pattern: BehaviorPattern;
  support_style: SupportStyle;
  summary?: string;
}

export interface RecoveryPathStep {
  title: string;
  description: string;
  is_primary: boolean;
}

export interface RecoveryPath {
  current_stage: RecoveryStage;
  stage_explanation: string;
  steps: RecoveryPathStep[];
}

export type AnalysisCardKey =
  | "pressure"
  | "pattern"
  | "biggest_risk"
  | "recovery_stage"
  | "recommended_actions"
  | "what_mina_sees";

export interface AnalysisCard {
  key: AnalysisCardKey;
  title: string;
  body: string;
}

export interface OnboardingAnalysis {
  narrative: string;
  cards: AnalysisCard[];
  biggest_risk: string;
  biggest_opportunity: string;
  recommended_next_step: {
    title: string;
    description: string;
    target_feature: string;
  };
  what_mina_sees: string[];
  risk_category: LegalRiskLevel;
}

export interface GuestOnboardingSession {
  version: typeof ONBOARDING_SESSION_VERSION;
  guest_session_id: string;
  created_at: string;
  expires_at: string;
  current_step: OnboardingStepKey | "welcome" | "results" | "signup_handoff";
  answers: OnboardingAnswers;
  pressure_profile: PressureProfile | null;
  recovery_path: RecoveryPath | null;
  analysis: OnboardingAnalysis | null;
  consents: OnboardingConsents;
  transfer_status: OnboardingTransferStatus;
}

export interface GuestSessionLoadResult {
  session: GuestOnboardingSession | null;
  expired: boolean;
  invalid: boolean;
}

export interface AnalyzeOnboardingRequest {
  answers: OnboardingAnswers;
  guest_session_id: string;
}

export interface AnalyzeOnboardingResponse {
  pressure_profile: PressureProfile;
  recovery_path: RecoveryPath;
  analysis: OnboardingAnalysis;
}

/** Payload copied to localStorage for post-signup DB transfer (Checkpoint 6+). */
export type GuestOnboardingTransferPayload = GuestOnboardingSession;
