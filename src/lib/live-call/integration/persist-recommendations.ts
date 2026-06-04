import "server-only";

import {
  assignLiveCallRecommendationPriorities,
  buildLiveCallRecommendationDrafts,
} from "@/lib/live-call/integration/build-recommendation-drafts";
import { LIVE_CALL_DASHBOARD_SOURCE_FEATURE } from "@/lib/live-call/integration/constants";
import type { LiveCallInsights } from "@/lib/live-call/integration/extract-insights";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PersistedLiveCallRecommendation {
  recommendation_key: string;
  dashboard_recommendation_id: string;
  title: string;
  priority: "primary" | "secondary";
  created: boolean;
}

async function loadExistingLiveCallRecommendations(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
) {
  const { data, error } = await supabase
    .from("dashboard_recommendations")
    .select("id, title, priority, status")
    .eq("user_id", userId)
    .eq("source_feature", LIVE_CALL_DASHBOARD_SOURCE_FEATURE)
    .eq("target_record_id", sessionId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function demoteExistingPrimaryRecommendations(
  supabase: SupabaseClient,
  userId: string,
) {
  const { error } = await supabase
    .from("dashboard_recommendations")
    .update({ priority: "secondary" })
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("priority", "primary");

  if (error) {
    throw new Error(error.message);
  }
}

export async function persistLiveCallDashboardRecommendations(input: {
  supabase: SupabaseClient;
  userId: string;
  sessionId: string;
  insights: LiveCallInsights;
}): Promise<PersistedLiveCallRecommendation[]> {
  const drafts = assignLiveCallRecommendationPriorities(
    buildLiveCallRecommendationDrafts(input.insights),
  );

  if (drafts.length === 0) {
    return [];
  }

  const existingRecommendations = await loadExistingLiveCallRecommendations(
    input.supabase,
    input.userId,
    input.sessionId,
  );
  const persisted: PersistedLiveCallRecommendation[] = [];
  let createdPrimary = false;

  for (const draft of drafts) {
    const existing = existingRecommendations.find(
      (recommendation) => recommendation.title === draft.title,
    );

    if (existing) {
      persisted.push({
        recommendation_key: draft.recommendationKey,
        dashboard_recommendation_id: existing.id,
        title: draft.title,
        priority: existing.priority as "primary" | "secondary",
        created: false,
      });
      continue;
    }

    if (draft.priority === "primary" && !createdPrimary) {
      await demoteExistingPrimaryRecommendations(input.supabase, input.userId);
      createdPrimary = true;
    }

    const { data, error } = await input.supabase
      .from("dashboard_recommendations")
      .insert({
        user_id: input.userId,
        priority: draft.priority,
        sort_order: draft.sortOrder,
        title: draft.title,
        reason: draft.reason,
        target_feature: draft.targetFeature,
        target_record_id: input.sessionId,
        source_feature: LIVE_CALL_DASHBOARD_SOURCE_FEATURE,
        status: "active",
      })
      .select("id, title, priority")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create live call dashboard recommendation.");
    }

    persisted.push({
      recommendation_key: draft.recommendationKey,
      dashboard_recommendation_id: data.id,
      title: data.title,
      priority: data.priority as "primary" | "secondary",
      created: true,
    });
  }

  return persisted;
}
