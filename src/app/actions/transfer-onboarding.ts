"use server";

import {
  guestOnboardingSessionSchema,
  parseOnboardingAnswersForAnalyze,
} from "@/lib/onboarding/schemas";
import {
  buildDashboardRecommendations,
  buildDebtProfileInsert,
  buildMemoryCandidates,
  buildOnboardingSessionAnalysisPayload,
  buildProfileUpdate,
  buildRecoveryStatusInsert,
  buildStressProfileInsert,
  resolveOnboardingIntelligence,
} from "@/lib/onboarding/transfer-intelligence";
import { createClient } from "@/lib/supabase/server";
import { ONBOARDING_STEP_KEYS } from "@/types/onboarding";
import type { OnboardingAnswers } from "@/types/onboarding";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TransferOnboardingResult =
  | {
      status: "success";
      sessionId: string;
      guestSessionId: string;
      answerCount: number;
      intelligenceSeeded: boolean;
    }
  | {
      status: "already_transferred";
      sessionId: string;
      guestSessionId: string | null;
      answerCount: number;
      intelligenceSeeded: boolean;
    }
  | {
      status: "error";
      message: string;
    };

async function seedIntelligenceLayers(input: {
  supabase: SupabaseClient;
  userId: string;
  sessionId: string;
  guestSession: ReturnType<typeof guestOnboardingSessionSchema.parse>;
  answers: OnboardingAnswers;
  transferredAt: string;
}): Promise<{ seeded: boolean; error?: string }> {
  const { supabase, userId, sessionId, guestSession, answers, transferredAt } =
    input;

  const intelligence = resolveOnboardingIntelligence(guestSession, answers);

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  if (profileReadError) {
    return { seeded: false, error: profileReadError.message };
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update(
      buildProfileUpdate(
        guestSession,
        answers,
        (profile?.preferences as Record<string, unknown> | null) ?? null,
      ),
    )
    .eq("id", userId);

  if (profileUpdateError) {
    return { seeded: false, error: profileUpdateError.message };
  }

  const { error: sessionUpdateError } = await supabase
    .from("onboarding_sessions")
    .update({
      pressure_profile: intelligence.pressure_profile,
      recovery_path: intelligence.recovery_path,
      analysis: buildOnboardingSessionAnalysisPayload(
        intelligence,
        transferredAt,
        guestSession.version,
      ),
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (sessionUpdateError) {
    return { seeded: false, error: sessionUpdateError.message };
  }

  const { data: existingDebtProfile } = await supabase
    .from("debt_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingDebtProfile) {
    const { error } = await supabase
      .from("debt_profiles")
      .insert(buildDebtProfileInsert(userId, answers, intelligence, transferredAt));

    if (error) {
      return { seeded: false, error: error.message };
    }
  }

  const { data: existingStressProfile } = await supabase
    .from("stress_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingStressProfile) {
    const { error } = await supabase
      .from("stress_profiles")
      .insert(buildStressProfileInsert(userId, answers, intelligence));

    if (error) {
      return { seeded: false, error: error.message };
    }
  }

  const { data: existingRecoveryStatus } = await supabase
    .from("recovery_statuses")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingRecoveryStatus) {
    const { error } = await supabase
      .from("recovery_statuses")
      .insert(buildRecoveryStatusInsert(userId, intelligence, transferredAt));

    if (error) {
      return { seeded: false, error: error.message };
    }
  }

  const { count: memoryCandidateCount, error: memoryCountError } = await supabase
    .from("memory_candidates")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("proposing_feature", "onboarding")
    .eq("source_record_id", sessionId);

  if (memoryCountError) {
    return { seeded: false, error: memoryCountError.message };
  }

  if ((memoryCandidateCount ?? 0) === 0) {
    const { error } = await supabase
      .from("memory_candidates")
      .insert(buildMemoryCandidates(userId, sessionId, answers, intelligence));

    if (error) {
      return { seeded: false, error: error.message };
    }
  }

  const { count: recommendationCount, error: recommendationCountError } =
    await supabase
      .from("dashboard_recommendations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source_feature", "onboarding");

  if (recommendationCountError) {
    return { seeded: false, error: recommendationCountError.message };
  }

  if ((recommendationCount ?? 0) === 0) {
    const { error } = await supabase
      .from("dashboard_recommendations")
      .insert(buildDashboardRecommendations(userId, intelligence));

    if (error) {
      return { seeded: false, error: error.message };
    }
  }

  return { seeded: true };
}

export async function transferOnboardingToDatabase(
  payload: unknown,
): Promise<TransferOnboardingResult> {
  const parsed = guestOnboardingSessionSchema.safeParse(payload);

  if (!parsed.success) {
    return { status: "error", message: "Invalid guest onboarding payload." };
  }

  const guestSession = parsed.data;
  const answersResult = parseOnboardingAnswersForAnalyze(guestSession.answers);

  if (!answersResult.success) {
    return {
      status: "error",
      message: "Onboarding answers are incomplete and cannot be transferred.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: "error", message: "You must be signed in to save onboarding." };
  }

  const transferredAt = new Date().toISOString();
  const { data: existingSession, error: existingError } = await supabase
    .from("onboarding_sessions")
    .select("id, analysis")
    .eq("user_id", user.id)
    .eq("is_origin_session", true)
    .maybeSingle();

  if (existingError) {
    return { status: "error", message: existingError.message };
  }

  if (existingSession) {
    const { count, error: countError } = await supabase
      .from("onboarding_answers")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_session_id", existingSession.id);

    if (countError) {
      return { status: "error", message: countError.message };
    }

    const intelligenceResult = await seedIntelligenceLayers({
      supabase,
      userId: user.id,
      sessionId: existingSession.id,
      guestSession,
      answers: answersResult.data,
      transferredAt,
    });

    if (intelligenceResult.error) {
      return { status: "error", message: intelligenceResult.error };
    }

    const storedMeta = existingSession.analysis as {
      transfer_meta?: { guest_session_id?: string };
    } | null;

    return {
      status: "already_transferred",
      sessionId: existingSession.id,
      guestSessionId: storedMeta?.transfer_meta?.guest_session_id ?? null,
      answerCount: count ?? 0,
      intelligenceSeeded: intelligenceResult.seeded,
    };
  }

  const intelligence = resolveOnboardingIntelligence(
    guestSession,
    answersResult.data,
  );

  const { data: insertedSession, error: sessionError } = await supabase
    .from("onboarding_sessions")
    .insert({
      user_id: user.id,
      session_number: 1,
      is_origin_session: true,
      status: "completed",
      started_at: guestSession.created_at,
      completed_at: transferredAt,
      pressure_profile: intelligence.pressure_profile,
      recovery_path: intelligence.recovery_path,
      analysis: buildOnboardingSessionAnalysisPayload(
        intelligence,
        transferredAt,
        guestSession.version,
      ),
    })
    .select("id")
    .single();

  if (sessionError || !insertedSession) {
    return {
      status: "error",
      message: sessionError?.message ?? "Failed to create onboarding session.",
    };
  }

  const answerRows = ONBOARDING_STEP_KEYS.map((stepKey) => ({
    user_id: user.id,
    onboarding_session_id: insertedSession.id,
    step_key: stepKey,
    response_data: answersResult.data[stepKey],
  }));

  const { error: answersError } = await supabase
    .from("onboarding_answers")
    .insert(answerRows);

  if (answersError) {
    return { status: "error", message: answersError.message };
  }

  const intelligenceResult = await seedIntelligenceLayers({
    supabase,
    userId: user.id,
    sessionId: insertedSession.id,
    guestSession,
    answers: answersResult.data,
    transferredAt,
  });

  if (intelligenceResult.error) {
    return { status: "error", message: intelligenceResult.error };
  }

  return {
    status: "success",
    sessionId: insertedSession.id,
    guestSessionId: guestSession.guest_session_id,
    answerCount: answerRows.length,
    intelligenceSeeded: intelligenceResult.seeded,
  };
}
