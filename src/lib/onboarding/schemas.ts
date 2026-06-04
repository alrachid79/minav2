import { z } from "zod";

import {
  ONBOARDING_SESSION_VERSION,
  ONBOARDING_STEP_KEYS,
  type GuestOnboardingSession,
  type OnboardingAnswers,
  type OnboardingStepKey,
} from "@/types/onboarding";

export const US_STATE_CODES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "AS",
  "GU",
  "MP",
  "PR",
  "VI",
] as const;

const yesNoNotSureSchema = z.enum(["yes", "no", "not_sure"]);

const stressSliderSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const currentSituationReasonSchema = z.enum([
  "collector_contacted",
  "letter_received",
  "worried_about_debt",
  "behind_on_payments",
  "facing_legal_action",
  "not_sure_where_to_start",
]);

const situationTypeCategorySchema = z.enum([
  "credit_card",
  "medical",
  "personal_loan",
  "auto_loan",
  "student_loans",
  "mortgage",
  "irs_tax",
  "utilities",
  "collections_unknown",
  "multiple_debts",
  "not_sure",
]);

const incomeRangeSchema = z.enum([
  "under_2000",
  "2000_4000",
  "4000_6000",
  "6000_10000",
  "over_10000",
  "prefer_not_to_say",
]);

const prohibitedContentPattern =
  /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b|\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;

export function containsProhibitedFinancialContent(value: string): boolean {
  return prohibitedContentPattern.test(value);
}

export const currentSituationAnswerSchema = z.object({
  reason: currentSituationReasonSchema,
});

export const situationTypeAnswerSchema = z.object({
  categories: z.array(situationTypeCategorySchema).min(1),
  follow_ups: z.array(
    z.object({
      category: situationTypeCategorySchema,
      response: z.string().trim().max(500),
    }),
  ),
  most_urgent: situationTypeCategorySchema.optional(),
});

export const severityAnswerSchema = z
  .object({
    received_letter: yesNoNotSureSchema,
    letter_about: z
      .enum([
        "payment_demand",
        "court_or_legal",
        "verification_or_validation",
        "not_sure",
        "not_opened_yet",
      ])
      .optional(),
    collector_contact: yesNoNotSureSchema,
    collector_contact_frequency: z
      .enum(["once", "a_few_times", "frequently", "not_sure"])
      .optional(),
    currently_sued: yesNoNotSureSchema,
    lawsuit_follow_up: z
      .enum(["served", "court_date_known", "heard_not_sure", "not_sure"])
      .optional(),
    wages_or_bank_affected: z.enum([
      "yes_garnishment_or_levy",
      "yes_unsure_type",
      "no",
      "not_sure",
    ]),
    upcoming_deadlines: yesNoNotSureSchema,
    deadline_window: z
      .enum([
        "within_2_weeks",
        "within_30_days",
        "more_than_30_days",
        "not_sure",
      ])
      .optional(),
    uncertainty_flags: z
      .array(
        z.enum([
          "who_is_contacting",
          "whether_i_owe",
          "what_if_ignore",
          "whether_legitimate",
          "what_to_do_first",
          "none_mostly_understand",
        ]),
      )
      .min(1),
  })
  .superRefine((data, ctx) => {
    if (data.received_letter === "yes" && !data.letter_about) {
      ctx.addIssue({
        code: "custom",
        message: "Letter type is required when you received a letter.",
        path: ["letter_about"],
      });
    }
  });

export const financialSnapshotAnswerSchema = z.object({
  us_state: z.enum(US_STATE_CODES),
  income_range: incomeRangeSchema,
  expense_range: incomeRangeSchema,
  emergency_savings_feel: z.enum([
    "very_difficult",
    "manageable_but_tight",
    "comfortable",
    "prefer_not_to_say",
  ]),
  debt_situation_count: z.enum([
    "one",
    "two_to_three",
    "four_or_more",
    "not_sure",
  ]),
});

export const stressProfileAnswerSchema = z.object({
  emotional_pressure: stressSliderSchema,
  financial_pressure: stressSliderSchema,
  legal_pressure: stressSliderSchema,
  confidence_level: stressSliderSchema,
  behavior_pattern: z.enum(["avoider", "analyzer", "reactor", "freezer"]),
  support_style: z.enum([
    "coach",
    "direct",
    "emotional_first",
    "educator",
    "accountability",
  ]),
  recovery_goals: z
    .array(
      z.enum([
        "stop_worrying",
        "respond_confidently",
        "settle_or_negotiate",
        "avoid_legal_problems",
        "create_a_plan",
        "rebuild_stability",
      ]),
    )
    .min(1)
    .max(3),
});

export const onboardingAnswersSchema = z.object({
  current_situation: currentSituationAnswerSchema.optional(),
  situation_type: situationTypeAnswerSchema.optional(),
  severity: severityAnswerSchema.optional(),
  financial_snapshot: financialSnapshotAnswerSchema.optional(),
  stress_profile: stressProfileAnswerSchema.optional(),
});

export const onboardingConsentsSchema = z.object({
  data_storage: z.boolean(),
  guidance_disclaimer: z.boolean(),
});

export const pressureProfileSchema = z.object({
  pressure_sources: z.array(z.string().min(1)).min(1),
  stress_intensity: z.enum(["low", "medium", "high", "critical"]),
  stress_label: z.string().min(1),
  behavior_pattern: z.enum(["avoider", "analyzer", "reactor", "freezer"]),
  support_style: z.enum([
    "coach",
    "direct",
    "emotional_first",
    "educator",
    "accountability",
  ]),
  summary: z.string().optional(),
});

export const recoveryPathSchema = z.object({
  current_stage: z.enum([
    "stabilize",
    "understand",
    "protect",
    "act",
    "resolve",
    "recover",
  ]),
  stage_explanation: z.string().min(1),
  steps: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        is_primary: z.boolean(),
      }),
    )
    .min(1)
    .max(5),
});

export const onboardingAnalysisSchema = z.object({
  narrative: z.string().min(1),
  cards: z
    .array(
      z.object({
        key: z.enum([
          "pressure",
          "pattern",
          "biggest_risk",
          "recovery_stage",
          "recommended_actions",
          "what_mina_sees",
        ]),
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .min(6)
    .max(6),
  biggest_risk: z.string().min(1),
  biggest_opportunity: z.string().min(1),
  recommended_next_step: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    target_feature: z.string().min(1),
  }),
  what_mina_sees: z.array(z.string().min(1)).min(1),
  risk_category: z.enum(["low", "medium", "high", "legal_attention"]),
});

export const guestOnboardingSessionSchema = z.object({
  version: z.literal(ONBOARDING_SESSION_VERSION),
  guest_session_id: z.string().uuid(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  current_step: z.enum([
    "welcome",
    "results",
    "signup_handoff",
    ...ONBOARDING_STEP_KEYS,
  ]),
  answers: onboardingAnswersSchema,
  pressure_profile: pressureProfileSchema.nullable(),
  recovery_path: recoveryPathSchema.nullable(),
  analysis: onboardingAnalysisSchema.nullable(),
  consents: onboardingConsentsSchema,
  transfer_status: z.enum(["pending", "completed"]).nullable(),
});

export const analyzeOnboardingRequestSchema = z.object({
  answers: onboardingAnswersSchema,
  guest_session_id: z.string().uuid(),
});

export const handoffConsentsSchema = z.object({
  data_storage: z.literal(true, {
    message: "You must agree to store your onboarding answers in your account.",
  }),
  guidance_disclaimer: z.literal(true, {
    message: "You must acknowledge that Mina provides guidance, not legal advice.",
  }),
});

const stepSchemaMap: Record<
  OnboardingStepKey,
  z.ZodType<OnboardingAnswers[OnboardingStepKey]>
> = {
  current_situation: currentSituationAnswerSchema,
  situation_type: situationTypeAnswerSchema,
  severity: severityAnswerSchema,
  financial_snapshot: financialSnapshotAnswerSchema,
  stress_profile: stressProfileAnswerSchema,
};

export function parseStepAnswer<K extends OnboardingStepKey>(
  stepKey: K,
  value: unknown,
):
  | { success: true; data: NonNullable<OnboardingAnswers[K]> }
  | { success: false; error: z.ZodError } {
  const schema = stepSchemaMap[stepKey];
  const result = schema.safeParse(value);

  if (result.success) {
    return { success: true, data: result.data as NonNullable<OnboardingAnswers[K]> };
  }

  return { success: false, error: result.error };
}

export function parseGuestOnboardingSession(
  value: unknown,
):
  | { success: true; data: GuestOnboardingSession }
  | { success: false; error: z.ZodError } {
  const result = guestOnboardingSessionSchema.safeParse(value);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

export function parseOnboardingAnswersForAnalyze(
  answers: unknown,
):
  | { success: true; data: OnboardingAnswers }
  | { success: false; error: string } {
  const result = onboardingAnswersSchema.safeParse(answers);

  if (!result.success) {
    return { success: false, error: "Onboarding answers are incomplete or invalid." };
  }

  const { data } = result;
  const missingSteps = ONBOARDING_STEP_KEYS.filter((key) => !data[key]);

  if (missingSteps.length > 0) {
    return {
      success: false,
      error: `Missing required onboarding steps: ${missingSteps.join(", ")}`,
    };
  }

  return { success: true, data };
}

export function parseHandoffConsents(
  consents: unknown,
):
  | { success: true; data: z.infer<typeof handoffConsentsSchema> }
  | { success: false; error: z.ZodError } {
  const result = handoffConsentsSchema.safeParse(consents);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}
