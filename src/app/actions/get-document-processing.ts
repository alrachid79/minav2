"use server";

import { buildCardsFromSnapshot, isLegalAttentionRequired } from "@/lib/documents/intelligence/snapshot-cards";
import { deriveDocumentProcessingState } from "@/lib/documents/processing-state";
import { createClient } from "@/lib/supabase/server";
import type {
  DocumentAnalysisRun,
  DocumentExtractedField,
  DocumentProcessingSnapshot,
  DocumentRecord,
  GetDocumentProcessingResult,
} from "@/types/documents";

const DOCUMENT_SELECT =
  "id, user_id, original_filename, mime_type, file_size_bytes, storage_bucket, storage_path, upload_status, page_count, document_type, risk_level, confirmed_at, confirmed_data, collector_id, creditor_id, debt_situation_id, created_at";

const RUN_SELECT =
  "id, user_id, document_id, run_number, status, extracted_text, plain_language_summary, what_mina_sees, recommended_actions, completed_at, created_at";

async function getLatestRun(
  supabase: Awaited<ReturnType<typeof createClient>>,
  documentId: string,
): Promise<DocumentAnalysisRun | null> {
  const { data, error } = await supabase
    .from("document_analysis_runs")
    .select(RUN_SELECT)
    .eq("document_id", documentId)
    .order("run_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as DocumentAnalysisRun | null) ?? null;
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

export async function buildDocumentSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  document: DocumentRecord,
): Promise<DocumentProcessingSnapshot> {
  const latestRun = await getLatestRun(supabase, document.id);
  const extractedFields = latestRun
    ? await getExtractedFields(supabase, latestRun.id)
    : [];

  const cards =
    latestRun && latestRun.plain_language_summary
      ? buildCardsFromSnapshot({ document, run: latestRun, extractedFields })
      : null;

  return {
    document,
    latestRun,
    extractedFields,
    cards,
    legalAttentionRequired: isLegalAttentionRequired(extractedFields),
    processingState: deriveDocumentProcessingState({ document, latestRun }),
  };
}

export async function getDocumentProcessingStatus(
  documentId: string,
): Promise<GetDocumentProcessingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const { data: document, error } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { status: "error", message: error.message };
  }

  if (!document) {
    return { status: "error", message: "Document not found." };
  }

  try {
    const snapshot = await buildDocumentSnapshot(
      supabase,
      document as DocumentRecord,
    );

    return {
      status: "success",
      snapshot,
    };
  } catch (fetchError) {
    return {
      status: "error",
      message:
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load processing status.",
    };
  }
}
