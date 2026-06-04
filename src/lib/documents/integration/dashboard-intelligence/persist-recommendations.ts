import "server-only";

import {
  assignRecommendationPriorities,
  buildDashboardRecommendationDrafts,
} from "@/lib/documents/integration/dashboard-intelligence/build-recommendation-drafts";
import { DOCUMENT_ANALYSIS_DASHBOARD_SOURCE_FEATURE } from "@/lib/documents/integration/dashboard-intelligence/constants";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PersistedDashboardRecommendationRecord {
  recommendation_key: string;
  dashboard_recommendation_id: string;
  title: string;
  priority: "primary" | "secondary";
  created: boolean;
}

async function loadExistingDocumentRecommendations(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
) {
  const { data, error } = await supabase
    .from("dashboard_recommendations")
    .select("id, title, priority, status")
    .eq("user_id", userId)
    .eq("source_feature", DOCUMENT_ANALYSIS_DASHBOARD_SOURCE_FEATURE)
    .eq("target_record_id", documentId)
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

export async function persistDocumentDashboardRecommendations(input: {
  supabase: SupabaseClient;
  userId: string;
  documentId: string;
  confirmedData: DocumentConfirmedData;
}): Promise<PersistedDashboardRecommendationRecord[]> {
  const drafts = assignRecommendationPriorities(
    buildDashboardRecommendationDrafts({
      confirmedData: input.confirmedData,
    }),
  );

  if (drafts.length === 0) {
    return [];
  }

  const existingRecommendations = await loadExistingDocumentRecommendations(
    input.supabase,
    input.userId,
    input.documentId,
  );
  const persisted: PersistedDashboardRecommendationRecord[] = [];
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
        target_record_id: input.documentId,
        source_feature: DOCUMENT_ANALYSIS_DASHBOARD_SOURCE_FEATURE,
        status: "active",
      })
      .select("id, title, priority")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create dashboard recommendation.");
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
