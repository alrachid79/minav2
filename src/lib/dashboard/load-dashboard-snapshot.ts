import "server-only";

import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/intelligence/classify";
import type { DocumentType } from "@/lib/documents/intelligence/types";
import { parseConfirmedData } from "@/lib/documents/integration/metadata";
import {
  deriveDocumentProcessingState,
  getProcessingStateLabel,
} from "@/lib/documents/processing-state";
import {
  isRecoveryStage,
  RECOVERY_STAGE_DESCRIPTIONS,
  RECOVERY_STAGE_LABELS,
} from "@/lib/dashboard/recovery-stage-display";
import { parseExportMetadata } from "@/lib/letters/export/export-metadata";
import { LETTER_STATUS_LABELS, LETTER_TYPE_LABELS } from "@/lib/letters/constants";
import type { DashboardSnapshot } from "@/types/dashboard";
import type { LetterType, LetterStatus } from "@/types/letters";
import type { RecoveryPath } from "@/types/onboarding";
import type { SupabaseClient } from "@supabase/supabase-js";

const RECENT_LIMIT = 5;

const LEGAL_ISSUE_LABELS: Record<string, string> = {
  lawsuit: "Lawsuit language",
  summons: "Summons",
  court_date: "Court date",
  garnishment: "Garnishment",
  judgment: "Judgment",
  irs_enforcement: "IRS enforcement",
};

function findLatestDocumentStageReason(
  documents: Array<{ confirmed_data: Record<string, unknown> | null }>,
): string | null {
  let latestReason: string | null = null;
  let latestAt = "";

  for (const document of documents) {
    const confirmed = parseConfirmedData(document.confirmed_data);
    const recovery = confirmed?.integration?.dashboard_intelligence?.recovery;

    if (!recovery?.updated || !recovery.stage_reason) {
      continue;
    }

    const integratedAt =
      confirmed?.integration?.dashboard_intelligence?.integrated_at ?? "";

    if (integratedAt >= latestAt) {
      latestAt = integratedAt;
      latestReason = recovery.stage_reason;
    }
  }

  return latestReason;
}

function timelineSeverityLabel(severity: string | null): string {
  if (severity === "attention") {
    return "Needs attention";
  }

  return "Info";
}

export async function loadDashboardSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardSnapshot> {
  const [
    recoveryResult,
    onboardingResult,
    recommendationsResult,
    legalEventsResult,
    documentsResult,
    lettersResult,
    timelineResult,
    integratedDocumentsResult,
  ] = await Promise.all([
    supabase
      .from("recovery_statuses")
      .select("current_stage, stage_changed_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("onboarding_sessions")
      .select("recovery_path")
      .eq("user_id", userId)
      .eq("is_origin_session", true)
      .maybeSingle(),
    supabase
      .from("dashboard_recommendations")
      .select("id, priority, title, reason, target_feature, sort_order")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("legal_attention_events")
      .select("id, issue_type, severity, created_at, source_record_id, source_feature")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("documents")
      .select("id, original_filename, document_type, upload_status, confirmed_at, confirmed_data, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("letters")
      .select("id, letter_type, status, recipient_snapshot, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("timeline_events")
      .select("id, title, description, severity, occurred_at, event_category")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("documents")
      .select("confirmed_data")
      .eq("user_id", userId)
      .not("confirmed_data", "is", null)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  const recoveryPath = onboardingResult.data?.recovery_path as RecoveryPath | null;
  const currentStageRaw = recoveryResult.data?.current_stage ?? recoveryPath?.current_stage ?? null;
  const currentStage =
    currentStageRaw && isRecoveryStage(currentStageRaw) ? currentStageRaw : null;

  const documentStageReason = findLatestDocumentStageReason(
    integratedDocumentsResult.data ?? [],
  );

  const recoveryStage = {
    currentStage,
    currentStageLabel: currentStage ? RECOVERY_STAGE_LABELS[currentStage] : null,
    stageExplanation: currentStage
      ? RECOVERY_STAGE_DESCRIPTIONS[currentStage]
      : null,
    stageReason:
      documentStageReason ??
      recoveryPath?.stage_explanation ??
      null,
    stageChangedAt: recoveryResult.data?.stage_changed_at ?? null,
  };

  const recommendations = (recommendationsResult.data ?? []).map((row) => ({
    id: row.id,
    priority: row.priority as "primary" | "secondary",
    title: row.title,
    reason: row.reason,
    targetFeature: row.target_feature,
    sortOrder: row.sort_order,
  }));

  const primary =
    recommendations.find((recommendation) => recommendation.priority === "primary") ??
    null;
  const secondary = recommendations.filter(
    (recommendation) => recommendation.priority === "secondary",
  );

  const legalDocumentIds = (legalEventsResult.data ?? [])
    .filter((event) => event.source_feature === "document_analysis" && event.source_record_id)
    .map((event) => event.source_record_id as string);

  let legalDocumentNames = new Map<string, string>();

  if (legalDocumentIds.length > 0) {
    const { data: legalDocuments } = await supabase
      .from("documents")
      .select("id, original_filename")
      .eq("user_id", userId)
      .in("id", legalDocumentIds);

    legalDocumentNames = new Map(
      (legalDocuments ?? []).map((document) => [document.id, document.original_filename]),
    );
  }

  const legalAttentionEvents = (legalEventsResult.data ?? []).map((event) => ({
    id: event.id,
    issueType: event.issue_type
      ? (LEGAL_ISSUE_LABELS[event.issue_type] ?? event.issue_type)
      : null,
    severity: event.severity,
    createdAt: event.created_at,
    sourceDocumentId: event.source_record_id,
    sourceDocumentName: event.source_record_id
      ? legalDocumentNames.get(event.source_record_id) ?? null
      : null,
  }));

  const documentIds = (documentsResult.data ?? []).map((document) => document.id);
  let latestRunsByDocument = new Map<
    string,
    { status: string; plain_language_summary: string | null }
  >();

  if (documentIds.length > 0) {
    const { data: runs } = await supabase
      .from("document_analysis_runs")
      .select("document_id, status, plain_language_summary, run_number")
      .in("document_id", documentIds)
      .order("run_number", { ascending: false });

    for (const run of runs ?? []) {
      if (!latestRunsByDocument.has(run.document_id)) {
        latestRunsByDocument.set(run.document_id, {
          status: run.status,
          plain_language_summary: run.plain_language_summary,
        });
      }
    }
  }

  const recentDocuments = (documentsResult.data ?? []).map((document) => {
    const latestRun = latestRunsByDocument.get(document.id) ?? null;
    const processingState = deriveDocumentProcessingState({
      document: {
        upload_status: document.upload_status as "uploading" | "ready" | "failed",
        confirmed_at: document.confirmed_at,
        confirmed_data: document.confirmed_data as Record<string, unknown> | null,
      },
      latestRun: latestRun
        ? {
            id: "",
            user_id: userId,
            document_id: document.id,
            run_number: 1,
            status: latestRun.status as "pending" | "completed" | "failed",
            extracted_text: null,
            plain_language_summary: latestRun.plain_language_summary,
            what_mina_sees: null,
            recommended_actions: null,
            completed_at: null,
            created_at: document.created_at,
          }
        : null,
    });
    const documentType = document.document_type as DocumentType | null;

    return {
      id: document.id,
      filename: document.original_filename,
      documentType: document.document_type,
      documentTypeLabel:
        documentType && documentType in DOCUMENT_TYPE_LABELS
          ? DOCUMENT_TYPE_LABELS[documentType]
          : "Unknown",
      processingState,
      processingStateLabel: getProcessingStateLabel(processingState),
      createdAt: document.created_at,
    };
  });

  const recentLetters = (lettersResult.data ?? []).map((letter) => {
    const letterType = letter.letter_type as LetterType;
    const status = letter.status as LetterStatus;
    const exportMetadata = parseExportMetadata(
      (letter.recipient_snapshot as Record<string, unknown> | null) ?? null,
    );

    return {
      id: letter.id,
      letterTypeLabel: LETTER_TYPE_LABELS[letterType] ?? letter.letter_type,
      status: letter.status,
      statusLabel: LETTER_STATUS_LABELS[status] ?? letter.status,
      exportCount: exportMetadata.count,
      createdAt: letter.created_at,
    };
  });

  const recentTimelineEvents = (timelineResult.data ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    summary: event.description?.split("\n").slice(1).join("\n").trim() || event.description || "",
    severity: event.severity,
    severityLabel: timelineSeverityLabel(event.severity),
    occurredAt: event.occurred_at,
    eventCategory: event.event_category,
  }));

  return {
    recoveryStage,
    recommendations: { primary, secondary },
    legalAttentionEvents,
    recentDocuments,
    recentLetters,
    recentTimelineEvents,
  };
}
