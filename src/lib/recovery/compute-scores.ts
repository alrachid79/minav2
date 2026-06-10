import {
  getRecoveryStageIndex,
  isRecoveryStage,
  RECOVERY_STAGE_DESCRIPTIONS,
  RECOVERY_STAGE_LABELS,
} from "@/lib/dashboard/recovery-stage-display";
import type { RecoveryPressureLevel } from "@/types/recovery-plan";
import type { RecoveryStage } from "@/types/onboarding";

export interface RecoveryScoreInput {
  onboardingComplete: boolean;
  recoveryStage: RecoveryStage | null;
  activeSituationCount: number;
  legalAttentionCount: number;
  upcomingDeadlineCount: number;
  highPressureCallCount: number;
  hasRecommendations: boolean;
  recentCompletedCallCount: number;
}

export interface PressureScoreInput {
  legalAttentionCount: number;
  upcomingDeadlineCount: number;
  activeSituationCount: number;
  highPressureCallCount: number;
}

const EMERGENCY_SAVINGS_FEEL_LABELS: Record<string, string> = {
  very_difficult: "Very difficult",
  manageable_but_tight: "Manageable but tight",
  comfortable: "Comfortable",
  prefer_not_to_say: "Prefer not to say",
};

export function formatEmergencySavingsFeel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return EMERGENCY_SAVINGS_FEEL_LABELS[value] ?? null;
}

export function computeRecoveryScore(input: RecoveryScoreInput): number {
  let score = 35;

  if (input.onboardingComplete) {
    score += 25;
  }

  if (input.recoveryStage) {
    score += 10;
    const stageIndex = getRecoveryStageIndex(input.recoveryStage);
    score += Math.round((stageIndex / 5) * 15);
  }

  if (input.hasRecommendations) {
    score += 7;
  }

  if (input.recentCompletedCallCount > 0) {
    score += 5;
  }

  score -= Math.min(input.legalAttentionCount * 12, 36);
  score -= Math.min(Math.max(input.activeSituationCount - 1, 0) * 8, 24);
  score -= input.upcomingDeadlineCount > 0 ? 15 : 0;
  score -= Math.min(input.highPressureCallCount * 12, 24);

  return Math.max(0, Math.min(100, score));
}

export function computePressureLevel(input: PressureScoreInput): RecoveryPressureLevel {
  let points = 0;

  points += input.legalAttentionCount * 3;
  points += input.upcomingDeadlineCount * 2;
  points += Math.max(input.activeSituationCount - 1, 0);
  points += input.highPressureCallCount * 2;

  if (
    input.legalAttentionCount >= 2 ||
    (input.legalAttentionCount >= 1 &&
      (input.upcomingDeadlineCount > 0 || input.highPressureCallCount > 0)) ||
    points >= 7
  ) {
    return "High";
  }

  if (
    input.legalAttentionCount >= 1 ||
    input.upcomingDeadlineCount > 0 ||
    input.activeSituationCount >= 2 ||
    input.highPressureCallCount > 0 ||
    points >= 3
  ) {
    return "Medium";
  }

  return "Low";
}

export function buildEmergencyFundNote(feelLabel: string | null, isComplete: boolean): string {
  if (!isComplete || !feelLabel) {
    return "Complete onboarding to add an emergency fund snapshot.";
  }

  if (feelLabel === "Very difficult") {
    return "Your cushion is thin — prioritize breathing room before large lump-sum offers.";
  }

  if (feelLabel === "Manageable but tight") {
    return "You have some room, but unexpected costs could still create pressure.";
  }

  return "You have a stronger cushion — still review offers carefully before committing.";
}

export function buildFlexibilityNote(isComplete: boolean, monthlyFlexibility: number): string {
  if (!isComplete || monthlyFlexibility <= 0) {
    return "Complete onboarding to estimate monthly flexibility.";
  }

  if (monthlyFlexibility <= 200) {
    return "Monthly room is limited — favor lower payment options when negotiating.";
  }

  if (monthlyFlexibility <= 400) {
    return "Some monthly room exists — compare offers against what you can sustain.";
  }

  return "You have more monthly room — still confirm terms in writing before deciding.";
}

export function resolveRecoveryStageDisplay(stage: RecoveryStage | null): {
  label: string | null;
  description: string | null;
} {
  if (!stage) {
    return {
      label: null,
      description: "Your recovery stage will appear as Mina learns more about your situation.",
    };
  }

  return {
    label: RECOVERY_STAGE_LABELS[stage],
    description: RECOVERY_STAGE_DESCRIPTIONS[stage],
  };
}

export function resolveRecoveryStage(value: string | null | undefined): RecoveryStage | null {
  if (!value || !isRecoveryStage(value)) {
    return null;
  }

  return value;
}

export function defaultNextRecoveryAction(hasSituations: boolean): string {
  if (hasSituations) {
    return "Review your active situations and confirm your next step for each one.";
  }

  return "Complete onboarding or review a letter to start building your recovery plan.";
}
