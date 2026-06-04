import "server-only";

import { buildMemoryCandidateDrafts } from "@/lib/documents/integration/dashboard-intelligence/build-memory-candidate-drafts";
import { DOCUMENT_ANALYSIS_DASHBOARD_SOURCE_FEATURE } from "@/lib/documents/integration/dashboard-intelligence/constants";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentExtractedField } from "@/types/documents";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PersistedMemoryCandidateRecord {
  category: string;
  memory_candidate_id: string;
  summary: string;
  confidence: number | null;
  created: boolean;
}

async function findExistingMemoryCandidate(
  supabase: SupabaseClient,
  input: {
    userId: string;
    documentId: string;
    category: string;
  },
) {
  const { data, error } = await supabase
    .from("memory_candidates")
    .select("id, category, proposed_content")
    .eq("user_id", input.userId)
    .eq("proposing_feature", DOCUMENT_ANALYSIS_DASHBOARD_SOURCE_FEATURE)
    .eq("source_record_id", input.documentId)
    .eq("category", input.category)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function persistDocumentMemoryCandidates(input: {
  supabase: SupabaseClient;
  userId: string;
  documentId: string;
  confirmedData: DocumentConfirmedData;
  extractedFields: DocumentExtractedField[];
  whatMinaSees: string | null;
  debtSituationId: string | null;
}): Promise<PersistedMemoryCandidateRecord[]> {
  const drafts = buildMemoryCandidateDrafts({
    confirmedData: input.confirmedData,
    extractedFields: input.extractedFields,
    whatMinaSees: input.whatMinaSees,
  });
  const persisted: PersistedMemoryCandidateRecord[] = [];

  for (const draft of drafts) {
    const existing = await findExistingMemoryCandidate(input.supabase, {
      userId: input.userId,
      documentId: input.documentId,
      category: draft.category,
    });

    if (existing) {
      persisted.push({
        category: draft.category,
        memory_candidate_id: existing.id,
        summary: draft.summary,
        confidence: draft.confidence,
        created: false,
      });
      continue;
    }

    const { data, error } = await input.supabase
      .from("memory_candidates")
      .insert({
        user_id: input.userId,
        proposing_feature: DOCUMENT_ANALYSIS_DASHBOARD_SOURCE_FEATURE,
        source_record_id: input.documentId,
        category: draft.category,
        proposed_content: draft.summary,
        debt_situation_id: input.debtSituationId,
        status: "pending",
      })
      .select("id, category")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create memory candidate.");
    }

    persisted.push({
      category: draft.category,
      memory_candidate_id: data.id,
      summary: draft.summary,
      confidence: draft.confidence,
      created: true,
    });
  }

  return persisted;
}
