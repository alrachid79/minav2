import "server-only";

import {
  proposeRecoveryStageUpdate,
  shouldApplyRecoveryStageUpdate,
} from "@/lib/documents/integration/dashboard-intelligence/propose-recovery-update";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { RecoveryStage } from "@/types/onboarding";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RecoveryStatusIntegrationRecord {
  updated: boolean;
  previous_stage: RecoveryStage | null;
  current_stage: RecoveryStage | null;
  stage_reason: string | null;
  stage_changed_at: string | null;
}

async function loadRecoveryStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  id: string;
  current_stage: RecoveryStage;
  stage_changed_at: string | null;
} | null> {
  const { data, error } = await supabase
    .from("recovery_statuses")
    .select("id, current_stage, stage_changed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    current_stage: data.current_stage as RecoveryStage,
    stage_changed_at: data.stage_changed_at,
  };
}

export async function updateRecoveryStatusFromDocument(input: {
  supabase: SupabaseClient;
  userId: string;
  confirmedData: DocumentConfirmedData;
  integratedAt: string;
}): Promise<RecoveryStatusIntegrationRecord> {
  const proposal = proposeRecoveryStageUpdate({
    confirmedData: input.confirmedData,
  });

  const existing = await loadRecoveryStatus(input.supabase, input.userId);

  if (!proposal) {
    return {
      updated: false,
      previous_stage: existing?.current_stage ?? null,
      current_stage: existing?.current_stage ?? null,
      stage_reason: null,
      stage_changed_at: existing?.stage_changed_at ?? null,
    };
  }

  if (!existing) {
    const { data, error } = await input.supabase
      .from("recovery_statuses")
      .insert({
        user_id: input.userId,
        current_stage: proposal.proposedStage,
        recovery_score: 0,
        stage_changed_at: input.integratedAt,
      })
      .select("current_stage, stage_changed_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create recovery status.");
    }

    return {
      updated: true,
      previous_stage: null,
      current_stage: data.current_stage as RecoveryStage,
      stage_reason: proposal.stageReason,
      stage_changed_at: data.stage_changed_at,
    };
  }

  if (
    !shouldApplyRecoveryStageUpdate({
      currentStage: existing.current_stage,
      proposedStage: proposal.proposedStage,
    })
  ) {
    return {
      updated: false,
      previous_stage: existing.current_stage,
      current_stage: existing.current_stage,
      stage_reason: proposal.stageReason,
      stage_changed_at: existing.stage_changed_at,
    };
  }

  const { data, error } = await input.supabase
    .from("recovery_statuses")
    .update({
      current_stage: proposal.proposedStage,
      stage_changed_at: input.integratedAt,
    })
    .eq("id", existing.id)
    .eq("user_id", input.userId)
    .select("current_stage, stage_changed_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update recovery status.");
  }

  return {
    updated: true,
    previous_stage: existing.current_stage,
    current_stage: data.current_stage as RecoveryStage,
    stage_reason: proposal.stageReason,
    stage_changed_at: data.stage_changed_at,
  };
}
