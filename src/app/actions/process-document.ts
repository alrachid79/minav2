"use server";

import { logProductEvent } from "@/lib/analytics/log-product-event";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { buildDocumentSnapshot } from "@/app/actions/get-document-processing";
import { analyzeDocumentIntelligence } from "@/lib/documents/intelligence/analyze";
import { buildIntelligenceFieldInserts } from "@/lib/documents/intelligence/persist-fields";
import { extractDocumentText } from "@/lib/documents/processing/extract-text";
import {
  buildExtractionErrorField,
  buildExtractionMetadataFields,
} from "@/lib/documents/processing/metadata-fields";
import { createClient } from "@/lib/supabase/server";
import type { DocumentRecord, ProcessDocumentResult } from "@/types/documents";

const DOCUMENT_SELECT =
  "id, user_id, original_filename, mime_type, file_size_bytes, storage_bucket, storage_path, upload_status, page_count, document_type, risk_level, confirmed_at, confirmed_data, collector_id, creditor_id, debt_situation_id, created_at";

interface FieldInsert {
  field_key: string;
  field_value: string;
  confidence_score?: number | null;
}

async function getLatestRunStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
): Promise<{ status: string; run_number: number } | null> {
  const { data, error } = await supabase
    .from("document_analysis_runs")
    .select("status, run_number")
    .eq("document_id", documentId)
    .order("run_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function persistFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  runId: string,
  fields: FieldInsert[],
) {
  if (fields.length === 0) {
    return;
  }

  const { error } = await supabase.from("document_extracted_fields").insert(
    fields.map((field) => ({
      document_analysis_run_id: runId,
      field_key: field.field_key,
      field_value: field.field_value,
      confidence_score: field.confidence_score ?? null,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function failRun(
  supabase: Awaited<ReturnType<typeof createClient>>,
  runId: string,
  message: string,
  document: DocumentRecord,
): Promise<ProcessDocumentResult> {
  await supabase
    .from("document_analysis_runs")
    .update({ status: "failed", completed_at: new Date().toISOString() })
    .eq("id", runId);

  await persistFields(supabase, runId, [buildExtractionErrorField(message)]);

  const snapshot = await buildDocumentSnapshot(supabase, document);

  return {
    status: "error",
    message,
    snapshot,
  };
}

export async function processDocument(
  documentId: string,
): Promise<ProcessDocumentResult> {
  console.info("[MINA_DIAG] processDocument server action entered", { documentId });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn("[MINA_DIAG] processDocument exit: no authenticated user", {
      documentId,
    });
    return { status: "error", message: "You must be signed in." };
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();

  console.info("[MINA_DIAG] document ownership check result", {
    documentId,
    userId: user.id,
    owned: Boolean(document),
    documentError: documentError?.message ?? null,
  });

  if (documentError) {
    return { status: "error", message: documentError.message };
  }

  if (!document) {
    return { status: "error", message: "Document not found." };
  }

  const typedDocument = document as DocumentRecord;

  if (typedDocument.upload_status !== "ready") {
    console.warn("[MINA_DIAG] processDocument exit: upload_status not ready", {
      documentId,
      uploadStatus: typedDocument.upload_status,
    });
    const snapshot = await buildDocumentSnapshot(supabase, typedDocument);

    return {
      status: "error",
      message: "This document is not ready for processing yet.",
      snapshot,
    };
  }

  const latestRun = await getLatestRunStatus(supabase, documentId);

  if (latestRun?.status === "pending") {
    const snapshot = await buildDocumentSnapshot(supabase, typedDocument);

    return {
      status: "already_processing",
      snapshot,
    };
  }

  if (latestRun?.status === "completed") {
    const snapshot = await buildDocumentSnapshot(supabase, typedDocument);

    return {
      status: "success",
      snapshot,
    };
  }

  const nextRunNumber = (latestRun?.run_number ?? 0) + 1;

  console.info("[MINA_DIAG] analysis run insert attempted", {
    documentId,
    userId: user.id,
    nextRunNumber,
  });

  const { data: pendingRun, error: pendingRunError } = await supabase
    .from("document_analysis_runs")
    .insert({
      user_id: user.id,
      document_id: documentId,
      run_number: nextRunNumber,
      status: "pending",
    })
    .select("id")
    .single();

  if (pendingRunError || !pendingRun) {
    console.error("[MINA_DIAG] analysis run insert failed", {
      documentId,
      error: pendingRunError?.message ?? "unknown",
    });
    return {
      status: "error",
      message: pendingRunError?.message ?? "Failed to queue document processing.",
    };
  }

  console.info("[MINA_DIAG] analysis run insert success", {
    documentId,
    runId: pendingRun.id,
    runNumber: nextRunNumber,
  });

  if (nextRunNumber === 1) {
    await logProductEvent(supabase, {
      userId: user.id,
      eventType: PRODUCT_EVENTS.DOCUMENT_UPLOADED,
      payload: { documentId, filename: typedDocument.original_filename },
    });
  }

  const runId = pendingRun.id;

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(typedDocument.storage_bucket)
    .download(typedDocument.storage_path);

  if (downloadError || !fileBlob) {
    console.error("[MINA_DIAG] storage download failure", {
      documentId,
      bucket: typedDocument.storage_bucket,
      path: typedDocument.storage_path,
      error: downloadError?.message ?? "missing file blob",
    });
    return failRun(
      supabase,
      runId,
      downloadError?.message ?? "Could not download the uploaded file.",
      typedDocument,
    );
  }

  console.info("[MINA_DIAG] storage download success", {
    documentId,
    bucket: typedDocument.storage_bucket,
    path: typedDocument.storage_path,
    byteLength: fileBlob.size,
  });

  const buffer = Buffer.from(await fileBlob.arrayBuffer());

  let extraction: Awaited<ReturnType<typeof extractDocumentText>>;

  try {
    extraction = await extractDocumentText({
      buffer,
      mimeType: typedDocument.mime_type,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Text extraction failed unexpectedly.";

    return failRun(supabase, runId, message, typedDocument);
  }

  if (!extraction.ok) {
    return failRun(supabase, runId, extraction.message, typedDocument);
  }

  const intelligence = analyzeDocumentIntelligence(extraction.text);
  const completedAt = new Date().toISOString();

  const { error: documentUpdateError } = await supabase
    .from("documents")
    .update({
      page_count: extraction.pageCount,
      document_type: intelligence.classification.documentType,
      risk_level: intelligence.riskLevel,
    })
    .eq("id", documentId);

  if (documentUpdateError) {
    return failRun(supabase, runId, documentUpdateError.message, typedDocument);
  }

  const { error: runUpdateError } = await supabase
    .from("document_analysis_runs")
    .update({
      status: "completed",
      extracted_text: extraction.text,
      plain_language_summary: intelligence.plainLanguageSummary,
      what_mina_sees: intelligence.whatMinaSees,
      recommended_actions: intelligence.recommendedActions,
      completed_at: completedAt,
    })
    .eq("id", runId);

  if (runUpdateError) {
    return {
      status: "error",
      message: runUpdateError.message,
    };
  }

  const metadataFields = buildExtractionMetadataFields(extraction.metadata).map(
    (field) => ({
      ...field,
      confidence_score: null,
    }),
  );
  const intelligenceFields = buildIntelligenceFieldInserts(intelligence);

  await persistFields(supabase, runId, [...metadataFields, ...intelligenceFields]);

  const { data: refreshedDocument, error: refreshError } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", documentId)
    .single();

  if (refreshError || !refreshedDocument) {
    return {
      status: "error",
      message: refreshError?.message ?? "Failed to refresh document status.",
    };
  }

  const snapshot = await buildDocumentSnapshot(
    supabase,
    refreshedDocument as DocumentRecord,
  );

  return {
    status: "success",
    snapshot,
  };
}
