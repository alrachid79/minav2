import "server-only";

import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/intelligence/classify";
import { ENTITY_FIELD_KEYS } from "@/lib/documents/intelligence/field-keys";
import { readConfirmedFieldValue } from "@/lib/documents/integration/confirmed-field-utils";
import type { MemoryCategory } from "@/types/onboarding";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentExtractedField } from "@/types/documents";

const COACHING_INSIGHT_MAX_LENGTH = 280;

export interface MemoryCandidateDraft {
  category: MemoryCategory;
  summary: string;
  confidence: number | null;
}

function readClassificationConfidence(
  extractedFields: DocumentExtractedField[],
): number | null {
  const raw = extractedFields.find(
    (field) => field.field_key === ENTITY_FIELD_KEYS.classificationConfidence,
  )?.field_value;

  if (!raw) {
    return null;
  }

  const parsed = Number.parseFloat(raw);

  return Number.isFinite(parsed) ? parsed : null;
}

function resolveSenderName(confirmedData: DocumentConfirmedData): string | null {
  return (
    readConfirmedFieldValue(confirmedData.collector_name) ??
    readConfirmedFieldValue(confirmedData.creditor_name)
  );
}

function truncateCoachingInsight(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length <= COACHING_INSIGHT_MAX_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, COACHING_INSIGHT_MAX_LENGTH - 1).trimEnd()}…`;
}

function firstCoachingInsight(whatMinaSees: string | null): string | null {
  if (!whatMinaSees) {
    return null;
  }

  const firstLine = whatMinaSees
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine ? truncateCoachingInsight(firstLine) : null;
}

export function buildMemoryCandidateDrafts(input: {
  confirmedData: DocumentConfirmedData;
  extractedFields: DocumentExtractedField[];
  whatMinaSees: string | null;
}): MemoryCandidateDraft[] {
  const confidence = readClassificationConfidence(input.extractedFields);
  const drafts: MemoryCandidateDraft[] = [];
  const documentTypeLabel =
    DOCUMENT_TYPE_LABELS[input.confirmedData.document_type] ??
    input.confirmedData.document_type;
  const senderName = resolveSenderName(input.confirmedData);
  const senderPhrase = senderName ? ` from ${senderName}` : "";

  drafts.push({
    category: "communication_preference",
    summary: `Uploaded and confirmed a ${documentTypeLabel}${senderPhrase}.`,
    confidence,
  });

  const coachingInsight = firstCoachingInsight(input.whatMinaSees);

  if (coachingInsight) {
    drafts.push({
      category: "coaching_insight",
      summary: coachingInsight,
      confidence,
    });
  }

  return drafts;
}
