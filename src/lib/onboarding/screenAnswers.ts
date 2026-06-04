import type {
  FinancialSnapshotAnswer,
  OnboardingAnswers,
  SeverityAnswer,
  SituationTypeAnswer,
  SituationTypeCategory,
  SituationTypeFollowUp,
  StressProfileAnswer,
  StressSliderValue,
} from "@/types/onboarding";

import { getOnboardingScreen } from "@/lib/onboarding/questions";

export type ScreenDraftAnswers = {
  situation_type: Partial<SituationTypeAnswer>;
  severity: Partial<SeverityAnswer>;
  financial_snapshot: Partial<FinancialSnapshotAnswer>;
  stress_profile: Partial<StressProfileAnswer>;
};

export function createEmptyDrafts(): ScreenDraftAnswers {
  return {
    situation_type: {},
    severity: {},
    financial_snapshot: {},
    stress_profile: {},
  };
}

const SCREEN_ANSWER_FIELD: Record<string, keyof SeverityAnswer | keyof FinancialSnapshotAnswer | keyof StressProfileAnswer | "categories" | "follow_ups" | "most_urgent" | "reason"> = {
  current_situation: "reason",
  situation_type: "categories",
  severity_received_letter: "received_letter",
  severity_letter_about: "letter_about",
  severity_collector_contact: "collector_contact",
  severity_collector_frequency: "collector_contact_frequency",
  severity_currently_sued: "currently_sued",
  severity_lawsuit_follow_up: "lawsuit_follow_up",
  severity_wages_bank: "wages_or_bank_affected",
  severity_upcoming_deadlines: "upcoming_deadlines",
  severity_deadline_window: "deadline_window",
  severity_uncertainty: "uncertainty_flags",
  financial_us_state: "us_state",
  financial_income: "income_range",
  financial_expenses: "expense_range",
  financial_emergency_savings: "emergency_savings_feel",
  financial_debt_count: "debt_situation_count",
  stress_emotional: "emotional_pressure",
  stress_financial: "financial_pressure",
  stress_legal: "legal_pressure",
  stress_confidence: "confidence_level",
  stress_behavior: "behavior_pattern",
  stress_support: "support_style",
  stress_recovery_goals: "recovery_goals",
};

export function isFollowUpScreen(screenId: string): boolean {
  return screenId.startsWith("situation_follow_up_");
}

export function getFollowUpCategory(screenId: string): SituationTypeCategory | null {
  if (!isFollowUpScreen(screenId)) {
    return null;
  }

  return screenId.replace("situation_follow_up_", "") as SituationTypeCategory;
}

export function readScreenValue(
  screenId: string,
  answers: OnboardingAnswers,
  drafts: ScreenDraftAnswers,
): string | string[] | number | null {
  if (screenId === "welcome") {
    return null;
  }

  if (screenId === "current_situation") {
    return answers.current_situation?.reason ?? null;
  }

  if (screenId === "situation_type") {
    const categories =
      drafts.situation_type.categories ??
      answers.situation_type?.categories ??
      [];
    return categories;
  }

  if (isFollowUpScreen(screenId)) {
    const category = getFollowUpCategory(screenId);
    if (!category) {
      return null;
    }

    if (category === "multiple_debts") {
      return (
        drafts.situation_type.most_urgent ??
        answers.situation_type?.most_urgent ??
        null
      );
    }

    const followUps =
      drafts.situation_type.follow_ups ??
      answers.situation_type?.follow_ups ??
      [];
    return followUps.find((item) => item.category === category)?.response ?? null;
  }

  const screen = getOnboardingScreen(screenId);
  if (!screen?.stepKey || screen.stepKey === "current_situation") {
    return null;
  }

  const field = SCREEN_ANSWER_FIELD[screenId];
  if (!field) {
    return null;
  }

  const saved = answers[screen.stepKey];
  const draft = drafts[screen.stepKey];

  if (draft && field in draft) {
    return (draft as unknown as Record<string, unknown>)[field as string] as
      | string
      | string[]
      | number
      | null;
  }

  if (saved && field in saved) {
    return (saved as unknown as Record<string, unknown>)[field as string] as
      | string
      | string[]
      | number
      | null;
  }

  return null;
}

export function applyScreenValue(
  screenId: string,
  value: string | string[] | number,
  drafts: ScreenDraftAnswers,
): ScreenDraftAnswers {
  if (screenId === "current_situation") {
    return drafts;
  }

  if (screenId === "situation_type") {
    return {
      ...drafts,
      situation_type: {
        ...drafts.situation_type,
        categories: value as SituationTypeCategory[],
      },
    };
  }

  if (isFollowUpScreen(screenId)) {
    const category = getFollowUpCategory(screenId);
    if (!category) {
      return drafts;
    }

    if (category === "multiple_debts") {
      return {
        ...drafts,
        situation_type: {
          ...drafts.situation_type,
          most_urgent: value as SituationTypeCategory,
        },
      };
    }

    const existing = drafts.situation_type.follow_ups ?? [];
    const withoutCategory = existing.filter((item) => item.category !== category);
    const nextFollowUp: SituationTypeFollowUp = {
      category,
      response: value as string,
    };

    return {
      ...drafts,
      situation_type: {
        ...drafts.situation_type,
        follow_ups: [...withoutCategory, nextFollowUp],
      },
    };
  }

  const screen = getOnboardingScreen(screenId);
  if (!screen?.stepKey || screen.stepKey === "current_situation") {
    return drafts;
  }

  const field = SCREEN_ANSWER_FIELD[screenId];
  if (!field) {
    return drafts;
  }

  return {
    ...drafts,
    [screen.stepKey]: {
      ...drafts[screen.stepKey],
      [field]: value,
    },
  };
}

export function validateScreenValue(
  screenId: string,
  value: string | string[] | number | null,
): string | null {
  const screen = getOnboardingScreen(screenId);
  if (!screen) {
    return "This screen could not be loaded.";
  }

  if (screen.inputType === "interstitial" || screenId === "welcome") {
    return null;
  }

  if (screen.inputType === "slider") {
    if (value === null || value === undefined) {
      return "Please choose a level that feels closest.";
    }
    return null;
  }

  if (screen.multiSelect) {
    if (!Array.isArray(value) || value.length === 0) {
      return "Please select at least one option.";
    }

    if (screenId === "stress_recovery_goals" && value.length > 3) {
      return "Please choose up to three options.";
    }

    return null;
  }

  if (value === null || value === undefined || value === "") {
    return "Please choose the option that feels closest.";
  }

  return null;
}

export function buildSituationTypeAnswer(
  answers: OnboardingAnswers,
  drafts: ScreenDraftAnswers,
): SituationTypeAnswer {
  return {
    categories:
      drafts.situation_type.categories ??
      answers.situation_type?.categories ??
      [],
    follow_ups:
      drafts.situation_type.follow_ups ??
      answers.situation_type?.follow_ups ??
      [],
    most_urgent:
      drafts.situation_type.most_urgent ??
      answers.situation_type?.most_urgent,
  };
}

export function buildSeverityAnswer(
  answers: OnboardingAnswers,
  drafts: ScreenDraftAnswers,
): SeverityAnswer {
  const draft = drafts.severity;
  const saved = answers.severity;

  return {
    received_letter: draft.received_letter ?? saved?.received_letter!,
    letter_about: draft.letter_about ?? saved?.letter_about,
    collector_contact: draft.collector_contact ?? saved?.collector_contact!,
    collector_contact_frequency:
      draft.collector_contact_frequency ?? saved?.collector_contact_frequency,
    currently_sued: draft.currently_sued ?? saved?.currently_sued!,
    lawsuit_follow_up: draft.lawsuit_follow_up ?? saved?.lawsuit_follow_up,
    wages_or_bank_affected:
      draft.wages_or_bank_affected ?? saved?.wages_or_bank_affected!,
    upcoming_deadlines:
      draft.upcoming_deadlines ?? saved?.upcoming_deadlines!,
    deadline_window: draft.deadline_window ?? saved?.deadline_window,
    uncertainty_flags: draft.uncertainty_flags ?? saved?.uncertainty_flags!,
  };
}

export function buildFinancialSnapshotAnswer(
  answers: OnboardingAnswers,
  drafts: ScreenDraftAnswers,
): FinancialSnapshotAnswer {
  const draft = drafts.financial_snapshot;
  const saved = answers.financial_snapshot;

  return {
    us_state: draft.us_state ?? saved?.us_state!,
    income_range: draft.income_range ?? saved?.income_range!,
    expense_range: draft.expense_range ?? saved?.expense_range!,
    emergency_savings_feel:
      draft.emergency_savings_feel ?? saved?.emergency_savings_feel!,
    debt_situation_count:
      draft.debt_situation_count ?? saved?.debt_situation_count!,
  };
}

export function buildStressProfileAnswer(
  drafts: ScreenDraftAnswers,
): StressProfileAnswer {
  const draft = drafts.stress_profile;

  return {
    emotional_pressure: draft.emotional_pressure as StressSliderValue,
    financial_pressure: draft.financial_pressure as StressSliderValue,
    legal_pressure: draft.legal_pressure as StressSliderValue,
    confidence_level: draft.confidence_level as StressSliderValue,
    behavior_pattern: draft.behavior_pattern!,
    support_style: draft.support_style!,
    recovery_goals: draft.recovery_goals!,
  };
}

export function getSectionIntroReflection(section: string): string | null {
  switch (section) {
    case "severity":
      return "Next, a few questions about what's happening. Answer at your own pace — 'Not sure' is always okay.";
    case "financial":
      return "A quick snapshot of your finances. Ranges are enough — we never need exact numbers.";
    case "stress":
      return "Finally, how this is affecting you. Your answers shape how Mina supports you going forward.";
    default:
      return null;
  }
}

export function isFirstScreenInSection(
  screenId: string,
  visibleScreenIds: string[],
): boolean {
  const screen = getOnboardingScreen(screenId);
  if (!screen) {
    return false;
  }

  const section = screen.section;
  const firstInSection = visibleScreenIds.find((id) => {
    const candidate = getOnboardingScreen(id);
    return candidate?.section === section;
  });

  return firstInSection === screenId;
}
