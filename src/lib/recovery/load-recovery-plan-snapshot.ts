import "server-only";

import {
  buildEmergencyFundNote,
  buildFlexibilityNote,
  computePressureLevel,
  computeRecoveryScore,
  defaultNextRecoveryAction,
  formatEmergencySavingsFeel,
  resolveRecoveryStage,
  resolveRecoveryStageDisplay,
} from "@/lib/recovery/compute-scores";
import {
  buildFinancialProfileFromSnapshot,
  formatMoneyValue,
} from "@/lib/live-call/whisper/financial-profile";
import { financialSnapshotAnswerSchema } from "@/lib/onboarding/schemas";
import type { RecoveryPlanSnapshot, RecoveryTimelineItem } from "@/types/recovery-plan";
import type { SupabaseClient } from "@supabase/supabase-js";

function timelineSummary(description: string | null): string | null {
  if (!description) {
    return null;
  }

  const lines = description.split("\n");
  const summary = lines.find((line) => !line.startsWith("mina_event_type:"));
  return summary?.trim() ?? description.trim();
}

function summaryIndicatesHighPressure(risks: unknown): boolean {
  if (!Array.isArray(risks)) {
    return false;
  }

  return risks.some((risk) =>
    typeof risk === "string" ? risk.toLowerCase().includes("high pressure") : false,
  );
}

export async function loadRecoveryPlanSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<RecoveryPlanSnapshot> {
  const [
    recoveryResult,
    onboardingSessionResult,
    situationsResult,
    legalResult,
    timelineResult,
    recommendationsResult,
    callsResult,
    summariesResult,
  ] = await Promise.all([
    supabase
      .from("recovery_statuses")
      .select("current_stage, stage_changed_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("onboarding_sessions")
      .select("id, completed_at")
      .eq("user_id", userId)
      .eq("is_origin_session", true)
      .maybeSingle(),
    supabase
      .from("debt_situations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("legal_attention_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("timeline_events")
      .select("id, title, description, occurred_at, event_category, is_legal_attention")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(8),
    supabase
      .from("dashboard_recommendations")
      .select("title, reason, sort_order")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .limit(1),
    supabase
      .from("live_call_sessions")
      .select("id, status, ended_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("ended_at", { ascending: false })
      .limit(10),
    supabase
      .from("live_call_summaries")
      .select("live_call_session_id, risks")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  let financialSnapshot: ReturnType<typeof financialSnapshotAnswerSchema.parse> | null = null;
  let onboardingComplete = Boolean(onboardingSessionResult.data?.completed_at);

  if (onboardingSessionResult.data?.id) {
    const { data: financialAnswer } = await supabase
      .from("onboarding_answers")
      .select("response_data")
      .eq("user_id", userId)
      .eq("onboarding_session_id", onboardingSessionResult.data.id)
      .eq("step_key", "financial_snapshot")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const parsed = financialSnapshotAnswerSchema.safeParse(financialAnswer?.response_data);
    if (parsed.success) {
      financialSnapshot = parsed.data;
      onboardingComplete = true;
    }
  }

  const profile = buildFinancialProfileFromSnapshot(financialSnapshot);
  const feelLabel = formatEmergencySavingsFeel(financialSnapshot?.emergency_savings_feel);

  const activeSituationCount = situationsResult.count ?? 0;
  const legalAttentionCount = legalResult.count ?? 0;
  const timeline = timelineResult.data ?? [];
  const upcomingDeadlineCount = timeline.filter(
    (event) => event.event_category === "upcoming_deadline",
  ).length;

  const completedSessionIds = new Set((callsResult.data ?? []).map((call) => call.id));
  const highPressureCallCount = (summariesResult.data ?? []).filter((summary) => {
    if (!completedSessionIds.has(summary.live_call_session_id)) {
      return false;
    }

    return summaryIndicatesHighPressure(summary.risks);
  }).length;

  const recentCompletedCallCount = (callsResult.data ?? []).filter((call) => {
    if (!call.ended_at) {
      return false;
    }

    const endedAt = new Date(call.ended_at);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return endedAt >= cutoff;
  }).length;

  const recoveryStage = resolveRecoveryStage(recoveryResult.data?.current_stage ?? null);
  const stageDisplay = resolveRecoveryStageDisplay(recoveryStage);
  const hasRecommendations = Boolean(recommendationsResult.data?.[0]);

  const recoveryScore = computeRecoveryScore({
    onboardingComplete: onboardingComplete && profile.is_complete,
    recoveryStage,
    activeSituationCount,
    legalAttentionCount,
    upcomingDeadlineCount,
    highPressureCallCount,
    hasRecommendations,
    recentCompletedCallCount,
  });

  const pressureLevel = computePressureLevel({
    legalAttentionCount,
    upcomingDeadlineCount,
    activeSituationCount,
    highPressureCallCount,
  });

  const primaryRecommendation = recommendationsResult.data?.[0];
  const nextRecoveryAction = primaryRecommendation?.title
    ? primaryRecommendation.title.endsWith(".")
      ? primaryRecommendation.title
      : `${primaryRecommendation.title}.`
    : defaultNextRecoveryAction(activeSituationCount > 0);

  const recentProgress: RecoveryTimelineItem[] = timeline.map((event) => ({
    id: event.id,
    title: event.title,
    summary: timelineSummary(event.description),
    occurredAt: event.occurred_at,
    isDeadline: event.event_category === "upcoming_deadline",
    isLegalAttention: event.is_legal_attention,
  }));

  return {
    recoveryScore,
    pressureLevel,
    emergencyFund: {
      feelLabel,
      savingsEstimate: profile.is_complete ? formatMoneyValue(profile.emergency_fund) : null,
      note: buildEmergencyFundNote(feelLabel, profile.is_complete),
    },
    monthlyFlexibility: {
      estimate: profile.is_complete ? formatMoneyValue(profile.monthly_flexibility) : null,
      note: buildFlexibilityNote(profile.is_complete, profile.monthly_flexibility),
    },
    recoveryStage: {
      label: stageDisplay.label,
      description: stageDisplay.description,
      changedAt: recoveryResult.data?.stage_changed_at ?? null,
    },
    nextRecoveryAction,
    activeSituationCount,
    recentProgress,
  };
}
