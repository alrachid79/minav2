"use server";

import { z } from "zod";

import {
  buildEntityIntegrationSummary,
  isEntityIntegrationComplete,
} from "@/lib/documents/integration/entity-summary";
import { isDashboardIntelligenceIntegrationComplete } from "@/lib/documents/integration/dashboard-intelligence/dashboard-intelligence-summary";
import { integrateDocumentDashboardIntelligence } from "@/lib/documents/integration/dashboard-intelligence/integrate-dashboard-intelligence";
import { isLegalAttentionIntegrationComplete } from "@/lib/documents/integration/legal-attention/legal-attention-summary";
import { integrateDocumentLegalAttentionEvents } from "@/lib/documents/integration/legal-attention/persist-events";
import {
  buildIntegrationReady,
  buildIntegrationStarted,
  getIntegrationMetadata,
  parseConfirmedData,
  withIntegrationMetadata,
} from "@/lib/documents/integration/metadata";
import { buildTimelineEventDrafts } from "@/lib/documents/integration/timeline/build-drafts";
import { integrateDocumentTimelineEvents } from "@/lib/documents/integration/timeline/persist-events";
import { isTimelineIntegrationComplete } from "@/lib/documents/integration/timeline/timeline-summary";
import { integrateDocumentEntities } from "@/lib/documents/integration/upsert-entities";
import { createClient } from "@/lib/supabase/server";
import type {
  DocumentConfirmedData,
  DocumentIntegrationEntitiesMetadata,
  EntityIntegrationSummary,
  IntegrateDocumentResult,
} from "@/types/document-confirm";
import type { DocumentExtractedField, DocumentRecord } from "@/types/documents";

const integrateDocumentSchema = z.object({
  documentId: z.string().uuid(),
});

const DOCUMENT_SELECT =
  "id, user_id, original_filename, created_at, confirmed_at, confirmed_data, upload_status, collector_id, creditor_id, debt_situation_id";

async function getLatestCompletedRun(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
): Promise<{
  id: string;
  completed_at: string | null;
  what_mina_sees: string | null;
} | null> {
  const { data, error } = await supabase
    .from("document_analysis_runs")
    .select("id, completed_at, what_mina_sees")
    .eq("document_id", documentId)
    .eq("status", "completed")
    .order("run_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getExtractedFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  runId: string,
): Promise<DocumentExtractedField[]> {
  const { data, error } = await supabase
    .from("document_extracted_fields")
    .select("field_key, field_value, confidence_score")
    .eq("document_analysis_run_id", runId);

  if (error) {
    throw new Error(error.message);
  }

  return (data as DocumentExtractedField[]) ?? [];
}

async function persistConfirmedData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
  confirmedData: DocumentConfirmedData,
): Promise<string | null> {
  const { error } = await supabase
    .from("documents")
    .update({
      confirmed_data: confirmedData as unknown as Record<string, unknown>,
    })
    .eq("id", documentId);

  return error?.message ?? null;
}

function buildEntitiesMetadata(input: {
  integratedAt: string;
  documentId: string;
  entityResult: Awaited<ReturnType<typeof integrateDocumentEntities>>;
}): DocumentIntegrationEntitiesMetadata {
  return {
    integrated_at: input.integratedAt,
    source_document_id: input.documentId,
    collector: input.entityResult.collector,
    creditor: input.entityResult.creditor,
    debt_situation: input.entityResult.debtSituation,
  };
}

export async function integrateConfirmedDocument(input: {
  documentId: string;
}): Promise<IntegrateDocumentResult> {
  const parsed = integrateDocumentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid document id.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", parsed.data.documentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (documentError) {
    return { status: "error", message: documentError.message };
  }

  if (!document) {
    return { status: "error", message: "Document not found." };
  }

  const typedDocument = document as DocumentRecord;

  if (!typedDocument.confirmed_at) {
    return {
      status: "error",
      message: "This document must be confirmed before it can be integrated.",
    };
  }

  if (typedDocument.upload_status !== "ready") {
    return {
      status: "error",
      message: "This document is not in a valid state for integration.",
    };
  }

  const confirmedData = parseConfirmedData(typedDocument.confirmed_data);

  if (!confirmedData) {
    return {
      status: "error",
      message: "Confirmed document data is missing or invalid.",
    };
  }

  const existingIntegration = getIntegrationMetadata(typedDocument.confirmed_data);
  const entityComplete = isEntityIntegrationComplete(typedDocument.confirmed_data);
  const timelineComplete = isTimelineIntegrationComplete(typedDocument.confirmed_data);
  const legalAttentionComplete = isLegalAttentionIntegrationComplete(
    typedDocument.confirmed_data,
  );
  const dashboardIntelligenceComplete = isDashboardIntelligenceIntegrationComplete(
    typedDocument.confirmed_data,
  );

  if (
    entityComplete &&
    timelineComplete &&
    legalAttentionComplete &&
    dashboardIntelligenceComplete
  ) {
    return {
      status: "already_integrated",
      integratedAt:
        existingIntegration?.dashboard_intelligence?.integrated_at ??
        existingIntegration?.legal_attention?.integrated_at ??
        existingIntegration?.timeline?.integrated_at ??
        existingIntegration?.entities?.integrated_at ??
        existingIntegration?.integrated_at ??
        typedDocument.confirmed_at,
      entities: buildEntityIntegrationSummary(existingIntegration?.entities),
    };
  }

  const startedAt = new Date().toISOString();
  let workingConfirmedData = withIntegrationMetadata(
    confirmedData,
    buildIntegrationStarted(existingIntegration, startedAt),
  );

  const startedError = await persistConfirmedData(
    supabase,
    parsed.data.documentId,
    workingConfirmedData,
  );

  if (startedError) {
    return { status: "error", message: startedError };
  }

  const latestRun = await getLatestCompletedRun(supabase, parsed.data.documentId);

  if (!latestRun) {
    return {
      status: "error",
      message: "Completed analysis run not found for this document.",
    };
  }

  const extractedFields = await getExtractedFields(supabase, latestRun.id);

  let entitiesMetadata =
    existingIntegration?.entities ??
    workingConfirmedData.integration?.entities ??
    null;

  if (!entityComplete) {
    try {
      const entityResult = await integrateDocumentEntities({
        supabase,
        userId: user.id,
        documentId: parsed.data.documentId,
        originalFilename: typedDocument.original_filename,
        confirmedData: workingConfirmedData,
        extractedFields,
        existingCollectorId: typedDocument.collector_id,
        existingCreditorId: typedDocument.creditor_id,
        existingDebtSituationId: typedDocument.debt_situation_id,
      });

      entitiesMetadata = buildEntitiesMetadata({
        integratedAt: new Date().toISOString(),
        documentId: parsed.data.documentId,
        entityResult,
      });

      workingConfirmedData = withIntegrationMetadata(workingConfirmedData, {
        ...workingConfirmedData.integration!,
        entities: entitiesMetadata,
      });

      const entityPersistError = await persistConfirmedData(
        supabase,
        parsed.data.documentId,
        workingConfirmedData,
      );

      if (entityPersistError) {
        return { status: "error", message: entityPersistError };
      }

      typedDocument.collector_id = entityResult.documentLinks.collector_id;
      typedDocument.creditor_id = entityResult.documentLinks.creditor_id;
      typedDocument.debt_situation_id = entityResult.documentLinks.debt_situation_id;
    } catch (entityError) {
      return {
        status: "error",
        message:
          entityError instanceof Error
            ? entityError.message
            : "Entity integration failed.",
      };
    }
  }

  const readyAt = new Date().toISOString();

  if (!timelineComplete) {
    try {
      const timelineDrafts = buildTimelineEventDrafts({
        documentId: parsed.data.documentId,
        originalFilename: typedDocument.original_filename,
        documentCreatedAt: typedDocument.created_at,
        analysisCompletedAt: latestRun.completed_at,
        confirmedAt: typedDocument.confirmed_at,
        integratedAt: readyAt,
        confirmedData: workingConfirmedData,
        collectorId: typedDocument.collector_id,
      });

      const timelineResult = await integrateDocumentTimelineEvents({
        supabase,
        userId: user.id,
        documentId: parsed.data.documentId,
        integratedAt: readyAt,
        drafts: timelineDrafts,
        collectorId: typedDocument.collector_id,
        debtSituationId: typedDocument.debt_situation_id,
      });

      workingConfirmedData = withIntegrationMetadata(workingConfirmedData, {
        ...workingConfirmedData.integration!,
        timeline: timelineResult,
      });
    } catch (timelineError) {
      return {
        status: "error",
        message:
          timelineError instanceof Error
            ? timelineError.message
            : "Timeline integration failed.",
      };
    }
  }

  if (!legalAttentionComplete) {
    try {
      const legalAttentionResult = await integrateDocumentLegalAttentionEvents({
        supabase,
        userId: user.id,
        documentId: parsed.data.documentId,
        integratedAt: readyAt,
        confirmedData: workingConfirmedData,
        extractedFields,
        debtSituationId: typedDocument.debt_situation_id,
        legalAttentionRequired: workingConfirmedData.legal_attention_required,
      });

      workingConfirmedData = withIntegrationMetadata(workingConfirmedData, {
        ...workingConfirmedData.integration!,
        legal_attention: legalAttentionResult,
      });
    } catch (legalAttentionError) {
      return {
        status: "error",
        message:
          legalAttentionError instanceof Error
            ? legalAttentionError.message
            : "Legal attention integration failed.",
      };
    }
  }

  if (!dashboardIntelligenceComplete) {
    try {
      const dashboardIntelligenceResult = await integrateDocumentDashboardIntelligence({
        supabase,
        userId: user.id,
        documentId: parsed.data.documentId,
        integratedAt: readyAt,
        confirmedData: workingConfirmedData,
        extractedFields,
        whatMinaSees: latestRun.what_mina_sees,
        debtSituationId: typedDocument.debt_situation_id,
      });

      workingConfirmedData = withIntegrationMetadata(workingConfirmedData, {
        ...workingConfirmedData.integration!,
        dashboard_intelligence: dashboardIntelligenceResult,
      });
    } catch (dashboardIntelligenceError) {
      return {
        status: "error",
        message:
          dashboardIntelligenceError instanceof Error
            ? dashboardIntelligenceError.message
            : "Dashboard intelligence integration failed.",
      };
    }
  }

  const readyMetadata = {
    ...buildIntegrationReady(workingConfirmedData.integration!, readyAt),
    entities: entitiesMetadata ?? undefined,
    timeline: workingConfirmedData.integration?.timeline,
    legal_attention: workingConfirmedData.integration?.legal_attention,
    dashboard_intelligence: workingConfirmedData.integration?.dashboard_intelligence,
  };
  const readyConfirmedData = withIntegrationMetadata(
    workingConfirmedData,
    readyMetadata,
  );

  const readyError = await persistConfirmedData(
    supabase,
    parsed.data.documentId,
    readyConfirmedData,
  );

  if (readyError) {
    return { status: "error", message: readyError };
  }

  return {
    status: "success",
    integratedAt: readyAt,
    integrationStatus: "integration_ready",
    entities: buildEntityIntegrationSummary(entitiesMetadata),
  };
}
