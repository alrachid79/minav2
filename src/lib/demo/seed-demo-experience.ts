import "server-only";

import { buildLiveCallSummary } from "@/lib/live-call/build-summary";
import { generateWhisperGuidance } from "@/lib/live-call/whisper/guidance-engine";
import { buildFinancialProfileFromSnapshot } from "@/lib/live-call/whisper/financial-profile";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface DemoSeedResult {
  seeded: boolean;
  reason: string;
  situationId?: string;
  sessionId?: string;
}

const DEMO_COLLECTOR_NAME = "Atlantic Card Services";
const DEMO_CREDITOR_NAME = "Original Bank";
const DEMO_SITUATION_LABEL = "Atlantic Card Services — $10,000 balance";
const DEMO_COLLECTOR_LINE =
  "We can settle the $10,000 balance for $4,000 by June 30.";

export async function seedDemoExperience(
  supabase: SupabaseClient,
  userId: string,
): Promise<DemoSeedResult> {
  const { count, error: countError } = await supabase
    .from("debt_situations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  if (countError) {
    return { seeded: false, reason: countError.message };
  }

  if ((count ?? 0) > 0) {
    return { seeded: false, reason: "Demo data already exists for this account." };
  }

  const now = new Date();
  const startedAt = new Date(now.getTime() - 1000 * 60 * 45).toISOString();
  const endedAt = new Date(now.getTime() - 1000 * 60 * 30).toISOString();
  const timelineAt = new Date(now.getTime() - 1000 * 60 * 20).toISOString();

  const { data: collector, error: collectorError } = await supabase
    .from("collectors")
    .insert({ user_id: userId, name: DEMO_COLLECTOR_NAME })
    .select("id")
    .single();

  if (collectorError || !collector) {
    return { seeded: false, reason: collectorError?.message ?? "Could not create collector." };
  }

  const { data: creditor, error: creditorError } = await supabase
    .from("creditors")
    .insert({ user_id: userId, name: DEMO_CREDITOR_NAME })
    .select("id")
    .single();

  if (creditorError || !creditor) {
    return { seeded: false, reason: creditorError?.message ?? "Could not create creditor." };
  }

  const { data: situation, error: situationError } = await supabase
    .from("debt_situations")
    .insert({
      user_id: userId,
      category: "collections",
      label: DEMO_SITUATION_LABEL,
      status: "active",
      collector_id: collector.id,
      creditor_id: creditor.id,
    })
    .select("id")
    .single();

  if (situationError || !situation) {
    return { seeded: false, reason: situationError?.message ?? "Could not create situation." };
  }

  await supabase.from("recovery_statuses").upsert(
    {
      user_id: userId,
      current_stage: "understand",
      recovery_score: 58,
      stage_changed_at: now.toISOString(),
    },
    { onConflict: "user_id" },
  );

  const { data: existingRecommendation } = await supabase
    .from("dashboard_recommendations")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("priority", "primary")
    .maybeSingle();

  if (!existingRecommendation) {
    await supabase.from("dashboard_recommendations").insert({
      user_id: userId,
      priority: "primary",
      sort_order: 1,
      title: "Ask whether monthly payments are available.",
      reason:
        "A settlement offer was noted on your sample call. Monthly options may reduce financial pressure.",
      target_feature: "live_call",
      source_feature: "live_call",
      status: "active",
    });
  }

  const { data: session, error: sessionError } = await supabase
    .from("live_call_sessions")
    .insert({
      user_id: userId,
      collector_id: collector.id,
      debt_situation_id: situation.id,
      status: "completed",
      started_at: startedAt,
      ended_at: endedAt,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return { seeded: false, reason: sessionError?.message ?? "Could not create call session." };
  }

  const profile = buildFinancialProfileFromSnapshot({
    us_state: "CA",
    income_range: "2000_4000",
    expense_range: "2000_4000",
    emergency_savings_feel: "very_difficult",
    debt_situation_count: "one",
  });

  const guidance = generateWhisperGuidance({
    collectorSaid: DEMO_COLLECTOR_LINE,
    userNotes: null,
    turnNumber: 1,
    priorTracker: null,
    financialProfile: profile,
  });

  const userContent = { text: DEMO_COLLECTOR_LINE, notes: null };
  const messages = [
    {
      live_call_session_id: session.id,
      sequence_number: 1,
      role: "user",
      message_type: "collector_input",
      content: userContent,
    },
    {
      live_call_session_id: session.id,
      sequence_number: 2,
      role: "mina",
      message_type: "mina_response",
      content: guidance,
    },
  ];

  const { error: messagesError } = await supabase.from("live_call_messages").insert(messages);

  if (messagesError) {
    return { seeded: false, reason: messagesError.message };
  }

  const summary = buildLiveCallSummary([
    {
      id: session.id,
      sequence_number: 1,
      role: "user",
      message_type: "collector_input",
      content: userContent,
      created_at: startedAt,
    },
    {
      id: `${session.id}-mina`,
      sequence_number: 2,
      role: "mina",
      message_type: "mina_response",
      content: guidance,
      created_at: endedAt,
    },
  ]);

  await supabase.from("live_call_summaries").insert({
    live_call_session_id: session.id,
    what_happened: summary.what_happened,
    important_points: summary.important_points,
    risks: summary.risks,
    recommended_actions: summary.recommended_actions,
    next_step: summary.next_step,
  });

  await supabase.from("timeline_events").insert([
    {
      user_id: userId,
      title: "Whisper Mode call completed",
      description:
        "mina_event_type:call_completed\nYou reviewed a settlement offer during a sample Whisper Mode call.",
      occurred_at: endedAt,
      event_category: "past_event",
      source_feature: "live_call",
      source_record_id: session.id,
      severity: "info",
      debt_situation_id: situation.id,
      collector_id: collector.id,
      is_manual: false,
      is_legal_attention: false,
      source_available: true,
    },
    {
      user_id: userId,
      title: "Settlement offer: $4,000",
      description:
        "mina_event_type:settlement_offer_detected\nA $4,000 settlement offer was noted with a June 30 deadline.",
      occurred_at: timelineAt,
      event_category: "past_event",
      source_feature: "live_call",
      source_record_id: session.id,
      severity: "attention",
      debt_situation_id: situation.id,
      collector_id: collector.id,
      is_manual: false,
      is_legal_attention: false,
      source_available: true,
    },
    {
      user_id: userId,
      title: "Deadline: June 30",
      description:
        "mina_event_type:deadline_detected\nResponse may be needed by June 30.",
      occurred_at: timelineAt,
      event_category: "upcoming_deadline",
      source_feature: "live_call",
      source_record_id: session.id,
      severity: "attention",
      debt_situation_id: situation.id,
      collector_id: collector.id,
      is_manual: false,
      is_legal_attention: false,
      source_available: true,
    },
  ]);

  return {
    seeded: true,
    reason: "Demo experience loaded.",
    situationId: situation.id,
    sessionId: session.id,
  };
}

export async function ensureDemoExperience(
  supabase: SupabaseClient,
  userId: string,
): Promise<DemoSeedResult | null> {
  if (process.env.DEMO_AUTO_SEED !== "true") {
    return null;
  }

  return seedDemoExperience(supabase, userId);
}
