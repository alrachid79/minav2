import "server-only";

import type { BuiltLiveCallSummary } from "@/lib/live-call/build-summary";
import {
  buildLiveCallEndTimelineDrafts,
  buildLiveCallStartedTimelineDraft,
} from "@/lib/live-call/integration/build-timeline-drafts";
import {
  extractLiveCallInsights,
  hasAnyLiveCallInsight,
} from "@/lib/live-call/integration/extract-insights";
import { persistLiveCallDashboardRecommendations } from "@/lib/live-call/integration/persist-recommendations";
import {
  persistLiveCallTimelineEvents,
  type LiveCallTimelineIntegrationResult,
} from "@/lib/live-call/integration/persist-timeline-events";
import type { LiveCallMessageRecord } from "@/types/live-call";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface LiveCallInsightsIntegrationResult {
  integrated_at: string;
  live_call_session_id: string;
  insights: ReturnType<typeof extractLiveCallInsights>;
  timeline: LiveCallTimelineIntegrationResult;
  recommendations: Awaited<ReturnType<typeof persistLiveCallDashboardRecommendations>>;
}

async function resolveCollectorName(
  supabase: SupabaseClient,
  userId: string,
  collectorId: string | null,
): Promise<string | null> {
  if (!collectorId) {
    return null;
  }

  const { data, error } = await supabase
    .from("collectors")
    .select("name")
    .eq("id", collectorId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.name ?? null;
}

export async function integrateLiveCallSessionStarted(input: {
  supabase: SupabaseClient;
  userId: string;
  sessionId: string;
  startedAt: string;
  collectorId: string | null;
  debtSituationId: string | null;
}): Promise<LiveCallTimelineIntegrationResult> {
  const integratedAt = new Date().toISOString();
  const collectorName = await resolveCollectorName(
    input.supabase,
    input.userId,
    input.collectorId,
  );

  return persistLiveCallTimelineEvents({
    supabase: input.supabase,
    userId: input.userId,
    sessionId: input.sessionId,
    integratedAt,
    drafts: [
      buildLiveCallStartedTimelineDraft({
        startedAt: input.startedAt,
        collectorName,
      }),
    ],
    collectorId: input.collectorId,
    debtSituationId: input.debtSituationId,
  });
}

export async function integrateLiveCallSessionCompleted(input: {
  supabase: SupabaseClient;
  userId: string;
  sessionId: string;
  endedAt: string;
  collectorId: string | null;
  debtSituationId: string | null;
  messages: LiveCallMessageRecord[];
  summary: BuiltLiveCallSummary;
}): Promise<LiveCallInsightsIntegrationResult> {
  const integratedAt = new Date().toISOString();
  const collectorName = await resolveCollectorName(
    input.supabase,
    input.userId,
    input.collectorId,
  );

  const insights = extractLiveCallInsights({
    messages: input.messages,
    summary: input.summary,
  });

  const userTurnCount = input.messages.filter((message) => message.role === "user").length;

  const timelineDrafts = buildLiveCallEndTimelineDrafts({
    endedAt: input.endedAt,
    collectorName,
    userTurnCount,
    insights,
  });

  const timeline = await persistLiveCallTimelineEvents({
    supabase: input.supabase,
    userId: input.userId,
    sessionId: input.sessionId,
    integratedAt,
    drafts: timelineDrafts,
    collectorId: input.collectorId,
    debtSituationId: input.debtSituationId,
  });

  const recommendations = hasAnyLiveCallInsight(insights)
    ? await persistLiveCallDashboardRecommendations({
        supabase: input.supabase,
        userId: input.userId,
        sessionId: input.sessionId,
        insights,
      })
    : [];

  return {
    integrated_at: integratedAt,
    live_call_session_id: input.sessionId,
    insights,
    timeline,
    recommendations,
  };
}
