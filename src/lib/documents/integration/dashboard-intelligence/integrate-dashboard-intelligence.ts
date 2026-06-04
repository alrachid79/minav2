import "server-only";

import { persistDocumentMemoryCandidates } from "@/lib/documents/integration/dashboard-intelligence/persist-memory-candidates";
import { persistDocumentDashboardRecommendations } from "@/lib/documents/integration/dashboard-intelligence/persist-recommendations";
import { updateRecoveryStatusFromDocument } from "@/lib/documents/integration/dashboard-intelligence/update-recovery-status";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentExtractedField } from "@/types/documents";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { PersistedDashboardRecommendationRecord } from "@/lib/documents/integration/dashboard-intelligence/persist-recommendations";
import type { PersistedMemoryCandidateRecord } from "@/lib/documents/integration/dashboard-intelligence/persist-memory-candidates";
import type { RecoveryStatusIntegrationRecord } from "@/lib/documents/integration/dashboard-intelligence/update-recovery-status";

export interface DashboardIntelligenceIntegrationResult {
  integrated_at: string;
  source_document_id: string;
  recommendations: PersistedDashboardRecommendationRecord[];
  memory_candidates: PersistedMemoryCandidateRecord[];
  recovery: RecoveryStatusIntegrationRecord;
}

export async function integrateDocumentDashboardIntelligence(input: {
  supabase: SupabaseClient;
  userId: string;
  documentId: string;
  integratedAt: string;
  confirmedData: DocumentConfirmedData;
  extractedFields: DocumentExtractedField[];
  whatMinaSees: string | null;
  debtSituationId: string | null;
}): Promise<DashboardIntelligenceIntegrationResult> {
  const recommendations = await persistDocumentDashboardRecommendations({
    supabase: input.supabase,
    userId: input.userId,
    documentId: input.documentId,
    confirmedData: input.confirmedData,
  });

  const memoryCandidates = await persistDocumentMemoryCandidates({
    supabase: input.supabase,
    userId: input.userId,
    documentId: input.documentId,
    confirmedData: input.confirmedData,
    extractedFields: input.extractedFields,
    whatMinaSees: input.whatMinaSees,
    debtSituationId: input.debtSituationId,
  });

  const recovery = await updateRecoveryStatusFromDocument({
    supabase: input.supabase,
    userId: input.userId,
    confirmedData: input.confirmedData,
    integratedAt: input.integratedAt,
  });

  return {
    integrated_at: input.integratedAt,
    source_document_id: input.documentId,
    recommendations,
    memory_candidates: memoryCandidates,
    recovery,
  };
}
