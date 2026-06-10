import "server-only";

import { buildFinancialProfileFromSnapshot, emptyProfile } from "@/lib/live-call/whisper/financial-profile";
import { financialSnapshotAnswerSchema } from "@/lib/onboarding/schemas";
import type { WhisperFinancialProfile } from "@/lib/live-call/whisper/financial-profile";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadUserFinancialProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<WhisperFinancialProfile> {
  const { data: session, error: sessionError } = await supabase
    .from("onboarding_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("is_origin_session", true)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError || !session) {
    return emptyProfile();
  }

  const { data: answer, error: answerError } = await supabase
    .from("onboarding_answers")
    .select("response_data")
    .eq("user_id", userId)
    .eq("onboarding_session_id", session.id)
    .eq("step_key", "financial_snapshot")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (answerError || !answer?.response_data) {
    return emptyProfile();
  }

  const parsed = financialSnapshotAnswerSchema.safeParse(answer.response_data);

  if (!parsed.success) {
    return emptyProfile();
  }

  return buildFinancialProfileFromSnapshot(parsed.data);
}
