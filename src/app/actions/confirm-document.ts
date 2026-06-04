"use server";

import { buildDocumentSnapshot } from "@/app/actions/get-document-processing";
import { ENTITY_FIELD_KEYS } from "@/lib/documents/intelligence/field-keys";
import { normalizeConfirmField } from "@/lib/documents/confirm/build-initial-values";
import {
  documentConfirmPayloadSchema,
  type DocumentConfirmPayload,
} from "@/lib/documents/confirm/schemas";
import { createClient } from "@/lib/supabase/server";
import type { ConfirmDocumentResult, DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentRecord } from "@/types/documents";

const DOCUMENT_SELECT =
  "id, user_id, original_filename, mime_type, file_size_bytes, storage_bucket, storage_path, upload_status, page_count, document_type, risk_level, confirmed_at, confirmed_data, created_at";

const FIELD_KEY_MAP: Record<
  keyof Omit<DocumentConfirmPayload, "documentId" | "documentType">,
  string
> = {
  collectorName: ENTITY_FIELD_KEYS.collectorName,
  creditorName: ENTITY_FIELD_KEYS.creditorName,
  balanceAmount: ENTITY_FIELD_KEYS.balanceAmount,
  documentDate: ENTITY_FIELD_KEYS.documentDate,
  responseDeadline: ENTITY_FIELD_KEYS.responseDeadline,
  courtDate: ENTITY_FIELD_KEYS.courtDate,
};

function buildConfirmedData(input: {
  payload: DocumentConfirmPayload;
  documentSummary: string;
  legalAttentionRequired: boolean;
  confirmedAt: string;
}): DocumentConfirmedData {
  const balance = normalizeConfirmField(input.payload.balanceAmount);

  return {
    document_type: input.payload.documentType,
    document_summary: input.documentSummary,
    legal_attention_required: input.legalAttentionRequired,
    collector_name: normalizeConfirmField(input.payload.collectorName),
    creditor_name: normalizeConfirmField(input.payload.creditorName),
    balance_amount: balance,
    balance_currency: {
      value: balance.unknown || !balance.value ? "" : "USD",
      unknown: balance.unknown || !balance.value,
    },
    document_date: normalizeConfirmField(input.payload.documentDate),
    response_deadline: normalizeConfirmField(input.payload.responseDeadline),
    court_date: normalizeConfirmField(input.payload.courtDate),
    confirmed_at: input.confirmedAt,
  };
}

export async function confirmDocument(
  payload: DocumentConfirmPayload,
): Promise<ConfirmDocumentResult> {
  const parsed = documentConfirmPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid confirmation data.",
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

  if (typedDocument.confirmed_at) {
    return {
      status: "already_confirmed",
      confirmedAt: typedDocument.confirmed_at,
    };
  }

  const snapshot = await buildDocumentSnapshot(supabase, typedDocument);

  if (snapshot.processingState !== "analyzed" || !snapshot.latestRun) {
    return {
      status: "error",
      message: "This document must be analyzed before it can be confirmed.",
    };
  }

  const confirmedAt = new Date().toISOString();
  const confirmedData = buildConfirmedData({
    payload: parsed.data,
    documentSummary: snapshot.latestRun.plain_language_summary ?? "",
    legalAttentionRequired: snapshot.legalAttentionRequired,
    confirmedAt,
  });

  const { error: updateDocumentError } = await supabase
    .from("documents")
    .update({
      confirmed_at: confirmedAt,
      confirmed_data: confirmedData,
      document_type: parsed.data.documentType,
    })
    .eq("id", parsed.data.documentId);

  if (updateDocumentError) {
    return { status: "error", message: updateDocumentError.message };
  }

  const { data: existingFields, error: fieldsError } = await supabase
    .from("document_extracted_fields")
    .select("id, field_key, field_value")
    .eq("document_analysis_run_id", snapshot.latestRun.id);

  if (fieldsError) {
    return { status: "error", message: fieldsError.message };
  }

  const originalValues = Object.fromEntries(
    (existingFields ?? []).map((field) => [field.field_key, field.field_value ?? ""]),
  );

  for (const [payloadKey, fieldKey] of Object.entries(FIELD_KEY_MAP) as Array<
    [keyof typeof FIELD_KEY_MAP, string]
  >) {
    const normalized = normalizeConfirmField(parsed.data[payloadKey]);
    const nextValue = normalized.unknown ? "" : normalized.value;
    const originalValue = originalValues[fieldKey] ?? "";
    const userCorrected = nextValue !== originalValue;

    if (!userCorrected) {
      continue;
    }

    const existing = (existingFields ?? []).find((field) => field.field_key === fieldKey);

    if (existing) {
      const { error: updateFieldError } = await supabase
        .from("document_extracted_fields")
        .update({
          field_value: nextValue,
          user_corrected: true,
        })
        .eq("id", existing.id);

      if (updateFieldError) {
        return { status: "error", message: updateFieldError.message };
      }
    } else if (nextValue.length > 0) {
      const { error: insertFieldError } = await supabase
        .from("document_extracted_fields")
        .insert({
          document_analysis_run_id: snapshot.latestRun.id,
          field_key: fieldKey,
          field_value: nextValue,
          user_corrected: true,
        });

      if (insertFieldError) {
        return { status: "error", message: insertFieldError.message };
      }
    }
  }

  if (parsed.data.documentType !== typedDocument.document_type) {
    const classificationField = (existingFields ?? []).find(
      (field) => field.field_key === ENTITY_FIELD_KEYS.classificationConfidence,
    );

    if (classificationField) {
      await supabase
        .from("document_extracted_fields")
        .update({ user_corrected: true })
        .eq("id", classificationField.id);
    }
  }

  return {
    status: "success",
    confirmedAt,
  };
}
