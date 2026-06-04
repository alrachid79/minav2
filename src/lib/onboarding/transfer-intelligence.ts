import { generateOnboardingAnalysis } from "@/lib/onboarding/analysis";
import type {
  AnalyzeOnboardingResponse,
  BehaviorPattern,
  GuestOnboardingSession,
  MemoryCategory,
  OnboardingAnswers,
  StressSliderValue,
} from "@/types/onboarding";

export interface ResolvedOnboardingIntelligence extends AnalyzeOnboardingResponse {
  guestSessionId: string;
}

export function resolveOnboardingIntelligence(
  guestSession: GuestOnboardingSession,
  answers: OnboardingAnswers,
): ResolvedOnboardingIntelligence {
  if (
    guestSession.analysis &&
    guestSession.pressure_profile &&
    guestSession.recovery_path
  ) {
    return {
      analysis: guestSession.analysis,
      pressure_profile: guestSession.pressure_profile,
      recovery_path: guestSession.recovery_path,
      guestSessionId: guestSession.guest_session_id,
    };
  }

  const generated = generateOnboardingAnalysis(answers);

  return {
    ...generated,
    guestSessionId: guestSession.guest_session_id,
  };
}

function sliderToIntensity(value: StressSliderValue): string {
  if (value <= 2) {
    return "low";
  }

  if (value === 3) {
    return "medium";
  }

  if (value === 4) {
    return "high";
  }

  return "critical";
}

function mapAvoidanceLevel(behaviorPattern: BehaviorPattern): string {
  switch (behaviorPattern) {
    case "avoider":
      return "high";
    case "freezer":
      return "high";
    case "reactor":
      return "low";
    case "analyzer":
      return "medium";
    default:
      return "medium";
  }
}

export function mapCollectorInvolvement(
  answers: OnboardingAnswers,
): string | null {
  const severity = answers.severity;

  if (!severity) {
    return null;
  }

  const hasCollector = severity.collector_contact === "yes";
  const hasLetter = severity.received_letter === "yes";

  if (hasCollector && hasLetter) {
    return "collector_and_letter";
  }

  if (hasCollector) {
    return severity.collector_contact_frequency === "frequently"
      ? "frequent_collector_contact"
      : "collector_contact";
  }

  if (hasLetter) {
    return "letter_received";
  }

  return "none";
}

export function buildProfileUpdate(
  guestSession: GuestOnboardingSession,
  answers: OnboardingAnswers,
  existingPreferences: Record<string, unknown> | null,
) {
  return {
    state: answers.financial_snapshot!.us_state,
    consents: guestSession.consents,
    preferences: {
      ...(existingPreferences ?? {}),
      onboarding_completed: true,
    },
  };
}

export function buildDebtProfileInsert(
  userId: string,
  answers: OnboardingAnswers,
  intelligence: ResolvedOnboardingIntelligence,
  transferredAt: string,
) {
  return {
    user_id: userId,
    debt_categories: answers.situation_type?.categories ?? [],
    collector_involvement: mapCollectorInvolvement(answers),
    legal_risk_level: intelligence.analysis.risk_category,
    summary: {
      onboarding_summary: intelligence.pressure_profile.summary ?? null,
      pressure_sources: intelligence.pressure_profile.pressure_sources,
      behavior_pattern: intelligence.pressure_profile.behavior_pattern,
      support_style: intelligence.pressure_profile.support_style,
      transferred_at: transferredAt,
    },
  };
}

export function buildStressProfileInsert(
  userId: string,
  answers: OnboardingAnswers,
  intelligence: ResolvedOnboardingIntelligence,
) {
  const stress = answers.stress_profile!;

  return {
    user_id: userId,
    stress_intensity: intelligence.pressure_profile.stress_intensity,
    fear_intensity: sliderToIntensity(stress.legal_pressure),
    avoidance_level: mapAvoidanceLevel(stress.behavior_pattern),
    pressure_level: sliderToIntensity(stress.financial_pressure),
  };
}

export function buildRecoveryStatusInsert(
  userId: string,
  intelligence: ResolvedOnboardingIntelligence,
  transferredAt: string,
) {
  return {
    user_id: userId,
    current_stage: intelligence.recovery_path.current_stage,
    recovery_score: 0,
    stage_changed_at: transferredAt,
  };
}

export interface MemoryCandidateInsert {
  user_id: string;
  proposing_feature: "onboarding";
  source_record_id: string;
  category: MemoryCategory;
  proposed_content: string;
  status: "pending";
}

export function buildMemoryCandidates(
  userId: string,
  sessionId: string,
  answers: OnboardingAnswers,
  intelligence: ResolvedOnboardingIntelligence,
): MemoryCandidateInsert[] {
  const stress = answers.stress_profile!;
  const candidates: MemoryCandidateInsert[] = [];

  candidates.push({
    user_id: userId,
    proposing_feature: "onboarding",
    source_record_id: sessionId,
    category: "communication_preference",
    proposed_content: `Prefers ${intelligence.pressure_profile.support_style.replaceAll("_", " ")} guidance.`,
    status: "pending",
  });

  candidates.push({
    user_id: userId,
    proposing_feature: "onboarding",
    source_record_id: sessionId,
    category: "behavioral_pattern",
    proposed_content: `When financial pressure hits, tends to respond as a ${stress.behavior_pattern.replaceAll("_", " ")}.`,
    status: "pending",
  });

  if (stress.legal_pressure >= 4 || intelligence.analysis.risk_category === "high" || intelligence.analysis.risk_category === "legal_attention") {
    candidates.push({
      user_id: userId,
      proposing_feature: "onboarding",
      source_record_id: sessionId,
      category: "fear_pattern",
      proposed_content: `Legal consequences are a significant source of worry (legal pressure ${stress.legal_pressure}/5).`,
      status: "pending",
    });
  }

  const coachingInsight =
    intelligence.analysis.what_mina_sees[0] ??
    intelligence.recovery_path.stage_explanation;

  candidates.push({
    user_id: userId,
    proposing_feature: "onboarding",
    source_record_id: sessionId,
    category: "coaching_insight",
    proposed_content: coachingInsight,
    status: "pending",
  });

  return candidates;
}

export interface DashboardRecommendationInsert {
  user_id: string;
  priority: "primary" | "secondary";
  sort_order: number;
  title: string;
  reason: string;
  target_feature: string;
  source_feature: "onboarding";
  status: "active";
}

export function buildDashboardRecommendations(
  userId: string,
  intelligence: ResolvedOnboardingIntelligence,
): DashboardRecommendationInsert[] {
  const primary = intelligence.analysis.recommended_next_step;
  const recommendations: DashboardRecommendationInsert[] = [
    {
      user_id: userId,
      priority: "primary",
      sort_order: 1,
      title: primary.title,
      reason: primary.description,
      target_feature: primary.target_feature,
      source_feature: "onboarding",
      status: "active",
    },
  ];

  const secondarySteps = intelligence.recovery_path.steps
    .filter((step) => !step.is_primary)
    .slice(0, 3);

  secondarySteps.forEach((step, index) => {
    recommendations.push({
      user_id: userId,
      priority: "secondary",
      sort_order: index + 2,
      title: step.title,
      reason: step.description,
      target_feature: "dashboard",
      source_feature: "onboarding",
      status: "active",
    });
  });

  return recommendations;
}

export function buildOnboardingSessionAnalysisPayload(
  intelligence: ResolvedOnboardingIntelligence,
  transferredAt: string,
  version: number,
) {
  return {
    ...intelligence.analysis,
    transfer_meta: {
      guest_session_id: intelligence.guestSessionId,
      transferred_at: transferredAt,
      version,
      intelligence_seeded: true,
    },
  };
}
