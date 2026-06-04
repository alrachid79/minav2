import {
  ONBOARDING_STEP_KEYS,
  type GuestOnboardingSession,
  type OnboardingAnswers,
  type OnboardingStepKey,
  type SituationTypeCategory,
} from "@/types/onboarding";

import { parseOnboardingAnswersForAnalyze, parseStepAnswer } from "@/lib/onboarding/schemas";
import {
  ANALYSIS_INTERSTITIAL_SCREEN,
  CURRENT_SITUATION_SCREEN,
  FINANCIAL_SCREENS,
  getSituationFollowUpScreenId,
  ONBOARDING_SECTION_LABELS,
  SEVERITY_SCREENS,
  SIGNUP_HANDOFF_SCREEN,
  SITUATION_TYPE_SCREEN,
  STRESS_SCREENS,
  WELCOME_SCREEN,
  type OnboardingSection,
} from "@/lib/onboarding/questions";

export interface OnboardingProgress {
  currentIndex: number;
  totalScreens: number;
  percentComplete: number;
  section: OnboardingSection;
  sectionLabel: string;
}

function getSelectedSituationCategories(
  answers: OnboardingAnswers,
): SituationTypeCategory[] {
  const categories = answers.situation_type?.categories ?? [];
  return categories.filter((category) => category !== "not_sure");
}

function getSituationFollowUpScreenIds(answers: OnboardingAnswers): string[] {
  const categories = getSelectedSituationCategories(answers);

  if (categories.length === 0 && answers.situation_type?.categories.includes("not_sure")) {
    return [];
  }

  const followUpCategories = new Set<SituationTypeCategory>();

  for (const category of categories) {
    if (category === "multiple_debts") {
      followUpCategories.add("multiple_debts");
      continue;
    }

    followUpCategories.add(category);
  }

  return Array.from(followUpCategories).map(getSituationFollowUpScreenId);
}

function shouldShowSeverityLetterAbout(answers: OnboardingAnswers): boolean {
  return answers.severity?.received_letter === "yes";
}

function shouldShowCollectorFrequency(answers: OnboardingAnswers): boolean {
  return answers.severity?.collector_contact === "yes";
}

function shouldShowLawsuitFollowUp(answers: OnboardingAnswers): boolean {
  const sued = answers.severity?.currently_sued;
  return sued === "yes" || sued === "not_sure";
}

function shouldShowDeadlineWindow(answers: OnboardingAnswers): boolean {
  return answers.severity?.upcoming_deadlines === "yes";
}

function isSeverityScreenVisible(
  screenId: string,
  answers: OnboardingAnswers,
): boolean {
  switch (screenId) {
    case "severity_letter_about":
      return shouldShowSeverityLetterAbout(answers);
    case "severity_collector_frequency":
      return shouldShowCollectorFrequency(answers);
    case "severity_lawsuit_follow_up":
      return shouldShowLawsuitFollowUp(answers);
    case "severity_deadline_window":
      return shouldShowDeadlineWindow(answers);
    default:
      return true;
  }
}

export function getVisibleScreenIds(answers: OnboardingAnswers): string[] {
  const situationFollowUps = getSituationFollowUpScreenIds(answers);

  const severityIds = SEVERITY_SCREENS.filter((screen) =>
    isSeverityScreenVisible(screen.id, answers),
  ).map((screen) => screen.id);

  return [
    WELCOME_SCREEN.id,
    CURRENT_SITUATION_SCREEN.id,
    SITUATION_TYPE_SCREEN.id,
    ...situationFollowUps,
    ...severityIds,
    ...FINANCIAL_SCREENS.map((screen) => screen.id),
    ...STRESS_SCREENS.map((screen) => screen.id),
    ANALYSIS_INTERSTITIAL_SCREEN.id,
    SIGNUP_HANDOFF_SCREEN.id,
  ];
}

export function getNextScreenId(
  currentScreenId: string,
  answers: OnboardingAnswers,
): string | null {
  const visibleScreens = getVisibleScreenIds(answers);
  const currentIndex = visibleScreens.indexOf(currentScreenId);

  if (currentIndex === -1) {
    return visibleScreens[0] ?? null;
  }

  return visibleScreens[currentIndex + 1] ?? null;
}

export function getPreviousScreenId(
  currentScreenId: string,
  answers: OnboardingAnswers,
): string | null {
  const visibleScreens = getVisibleScreenIds(answers);
  const currentIndex = visibleScreens.indexOf(currentScreenId);

  if (currentIndex <= 0) {
    return null;
  }

  return visibleScreens[currentIndex - 1] ?? null;
}

export function getFirstIncompleteScreenId(
  answers: OnboardingAnswers,
): string {
  return getVisibleScreenIds(answers)[0] ?? WELCOME_SCREEN.id;
}

export function isStepGroupComplete(
  stepKey: OnboardingStepKey,
  answers: OnboardingAnswers,
): boolean {
  const stepAnswer = answers[stepKey];

  if (!stepAnswer) {
    return false;
  }

  return parseStepAnswer(stepKey, stepAnswer).success;
}

export function getCompletedStepGroups(
  answers: OnboardingAnswers,
): OnboardingStepKey[] {
  return ONBOARDING_STEP_KEYS.filter((stepKey) =>
    isStepGroupComplete(stepKey, answers),
  );
}

export function calculateOnboardingProgress(
  currentScreenId: string,
  answers: OnboardingAnswers,
): OnboardingProgress {
  const visibleScreens = getVisibleScreenIds(answers);
  const currentIndex = Math.max(visibleScreens.indexOf(currentScreenId), 0);
  const totalScreens = visibleScreens.length;
  const percentComplete =
    totalScreens <= 1
      ? 0
      : Math.round((currentIndex / (totalScreens - 1)) * 100);

  const screen =
    visibleScreens[currentIndex] === currentScreenId
      ? getSectionForScreenId(currentScreenId)
      : getSectionForScreenId(visibleScreens[currentIndex] ?? WELCOME_SCREEN.id);

  return {
    currentIndex: currentIndex + 1,
    totalScreens,
    percentComplete,
    section: screen,
    sectionLabel: ONBOARDING_SECTION_LABELS[screen],
  };
}

function getSectionForScreenId(screenId: string): OnboardingSection {
  if (screenId === WELCOME_SCREEN.id) {
    return "welcome";
  }

  if (screenId === ANALYSIS_INTERSTITIAL_SCREEN.id) {
    return "results";
  }

  if (screenId === SIGNUP_HANDOFF_SCREEN.id) {
    return "signup";
  }

  if (
    screenId === CURRENT_SITUATION_SCREEN.id ||
    screenId === SITUATION_TYPE_SCREEN.id ||
    screenId.startsWith("situation_follow_up_")
  ) {
    return "situation";
  }

  if (screenId.startsWith("severity_")) {
    return "severity";
  }

  if (screenId.startsWith("financial_")) {
    return "financial";
  }

  if (screenId.startsWith("stress_")) {
    return "stress";
  }

  return "welcome";
}

export function isReadyForAnalysis(answers: OnboardingAnswers): boolean {
  return parseOnboardingAnswersForAnalyze(answers).success;
}

export function isReadyForSignupHandoff(
  session: Pick<
    GuestOnboardingSession,
    "analysis" | "pressure_profile" | "recovery_path" | "consents"
  >,
): boolean {
  return (
    session.analysis !== null &&
    session.pressure_profile !== null &&
    session.recovery_path !== null &&
    session.consents.data_storage &&
    session.consents.guidance_disclaimer
  );
}

import {
  ANALYSIS_RESULT_SCREEN_IDS,
  type AnalysisResultScreenId,
} from "@/lib/onboarding/resultScreens";

export function getAnalysisResultsScreenIds(): AnalysisResultScreenId[] {
  return [...ANALYSIS_RESULT_SCREEN_IDS];
}

export function isOnboardingQuestionFlowComplete(
  answers: OnboardingAnswers,
): boolean {
  return isReadyForAnalysis(answers);
}
