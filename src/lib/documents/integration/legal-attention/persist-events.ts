import "server-only";

import {
  assignLegalAttentionSeverity,
  DOCUMENT_ANALYSIS_LEGAL_SOURCE_FEATURE,
} from "@/lib/documents/integration/legal-attention/assign-severity";
import {
  groupIndicatorsByIssueType,
  parseLegalAttentionIndicators,
} from "@/lib/documents/integration/legal-attention/parse-indicators";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentExtractedField } from "@/types/documents";
import type { LegalAttentionIndicator } from "@/lib/documents/intelligence/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PersistedLegalAttentionEventRecord {
  issue_type: string;
  legal_attention_event_id: string;
  created: boolean;
  severity: string;
  indicators: LegalAttentionIndicator[];
  created_at: string;
}

export interface LegalAttentionIntegrationResult {
  integrated_at: string;
  source_document_id: string;
  events: PersistedLegalAttentionEventRecord[];
}

async function findExistingLegalAttentionEvent(
  supabase: SupabaseClient,
  input: {
    userId: string;
    documentId: string;
    issueType: string;
  },
) {
  const { data, error } = await supabase
    .from("legal_attention_events")
    .select("id, issue_type, severity, created_at")
    .eq("user_id", input.userId)
    .eq("source_feature", DOCUMENT_ANALYSIS_LEGAL_SOURCE_FEATURE)
    .eq("source_record_id", input.documentId)
    .eq("issue_type", input.issueType)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function integrateDocumentLegalAttentionEvents(input: {
  supabase: SupabaseClient;
  userId: string;
  documentId: string;
  integratedAt: string;
  confirmedData: DocumentConfirmedData;
  extractedFields: DocumentExtractedField[];
  debtSituationId: string | null;
  legalAttentionRequired: boolean;
}): Promise<LegalAttentionIntegrationResult> {
  if (!input.legalAttentionRequired) {
    return {
      integrated_at: input.integratedAt,
      source_document_id: input.documentId,
      events: [],
    };
  }

  const indicators = parseLegalAttentionIndicators(input.extractedFields);
  const grouped = groupIndicatorsByIssueType(indicators);
  const persisted: PersistedLegalAttentionEventRecord[] = [];

  for (const [issueType, issueIndicators] of grouped.entries()) {
    const severity = assignLegalAttentionSeverity({
      issueType,
      confirmedData: input.confirmedData,
    });

    const existing = await findExistingLegalAttentionEvent(input.supabase, {
      userId: input.userId,
      documentId: input.documentId,
      issueType,
    });

    if (existing) {
      persisted.push({
        issue_type: issueType,
        legal_attention_event_id: existing.id,
        created: false,
        severity: existing.severity,
        indicators: issueIndicators,
        created_at: existing.created_at,
      });
      continue;
    }

    const { data, error } = await input.supabase
      .from("legal_attention_events")
      .insert({
        user_id: input.userId,
        source_feature: DOCUMENT_ANALYSIS_LEGAL_SOURCE_FEATURE,
        source_record_id: input.documentId,
        issue_type: issueType,
        severity,
        status: "active",
        debt_situation_id: input.debtSituationId,
      })
      .select("id, severity, created_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create legal attention event.");
    }

    persisted.push({
      issue_type: issueType,
      legal_attention_event_id: data.id,
      created: true,
      severity: data.severity,
      indicators: issueIndicators,
      created_at: data.created_at,
    });
  }

  return {
    integrated_at: input.integratedAt,
    source_document_id: input.documentId,
    events: persisted,
  };
}
