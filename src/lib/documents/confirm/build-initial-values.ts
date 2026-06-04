import { ENTITY_FIELD_KEYS } from "@/lib/documents/intelligence/field-keys";
import type { DocumentType } from "@/lib/documents/intelligence/types";
import type {
  DocumentConfirmFormValues,
  ConfirmFieldValue,
} from "@/types/document-confirm";
import type { DocumentProcessingSnapshot } from "@/types/documents";

function readEntityField(
  snapshot: DocumentProcessingSnapshot,
  key: string,
): string {
  const match = snapshot.extractedFields.find((field) => field.field_key === key);

  return match?.field_value?.trim() ?? "";
}

function toConfirmField(value: string): ConfirmFieldValue {
  return {
    value,
    unknown: value.length === 0,
  };
}

export function buildInitialConfirmValues(
  snapshot: DocumentProcessingSnapshot,
): DocumentConfirmFormValues {
  const documentType = (snapshot.document.document_type ??
    "unknown") as DocumentType;

  return {
    documentType,
    collectorName: toConfirmField(
      readEntityField(snapshot, ENTITY_FIELD_KEYS.collectorName),
    ),
    creditorName: toConfirmField(
      readEntityField(snapshot, ENTITY_FIELD_KEYS.creditorName),
    ),
    balanceAmount: toConfirmField(
      readEntityField(snapshot, ENTITY_FIELD_KEYS.balanceAmount),
    ),
    documentDate: toConfirmField(
      readEntityField(snapshot, ENTITY_FIELD_KEYS.documentDate),
    ),
    responseDeadline: toConfirmField(
      readEntityField(snapshot, ENTITY_FIELD_KEYS.responseDeadline),
    ),
    courtDate: toConfirmField(
      readEntityField(snapshot, ENTITY_FIELD_KEYS.courtDate),
    ),
  };
}

export function normalizeConfirmField(field: ConfirmFieldValue): ConfirmFieldValue {
  if (field.unknown) {
    return { value: "", unknown: true };
  }

  return {
    value: field.value.trim(),
    unknown: field.value.trim().length === 0,
  };
}
