import { buildAnalysisCards } from "@/lib/documents/intelligence/build-cards";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/intelligence/classify";
import { TECHNICAL_FIELD_KEYS } from "@/lib/documents/intelligence/field-keys";
import type {
  DocumentAnalysisCards,
  DocumentType,
  ExtractedEntities,
  LegalAttentionIndicator,
  RecommendedAction,
} from "@/lib/documents/intelligence/types";
import type {
  DocumentAnalysisRun,
  DocumentExtractedField,
  DocumentRecord,
} from "@/types/documents";

function fieldMap(
  fields: DocumentExtractedField[],
): Record<string, DocumentExtractedField> {
  return Object.fromEntries(fields.map((field) => [field.field_key, field]));
}

function readField(map: Record<string, DocumentExtractedField>, key: string) {
  return map[key]?.field_value ?? null;
}

function parseLegalIndicators(value: string | null): LegalAttentionIndicator[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as LegalAttentionIndicator[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function entitiesFromFields(
  map: Record<string, DocumentExtractedField>,
): ExtractedEntities {
  return {
    senderName: readField(map, "sender_name"),
    collectorName: readField(map, "collector_name"),
    creditorName: readField(map, "creditor_name"),
    balanceAmount: readField(map, "balance_amount"),
    balanceCurrency: readField(map, "balance_currency"),
    accountReference: readField(map, "account_reference"),
    documentDate: readField(map, "document_date"),
    responseDeadline: readField(map, "response_deadline"),
    courtDate: readField(map, "court_date"),
    contactPhone: readField(map, "contact_phone"),
    contactEmail: readField(map, "contact_email"),
    contactAddress: readField(map, "contact_address"),
  };
}

function parseRecommendedActions(
  value: DocumentAnalysisRun["recommended_actions"],
): RecommendedAction[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (action): action is RecommendedAction =>
      typeof action === "object" &&
      action !== null &&
      "priority" in action &&
      "title" in action &&
      "description" in action,
  );
}

export function buildCardsFromSnapshot(input: {
  document: Pick<DocumentRecord, "document_type">;
  run: DocumentAnalysisRun;
  extractedFields: DocumentExtractedField[];
}): DocumentAnalysisCards | null {
  if (!input.run.plain_language_summary) {
    return null;
  }

  const entityFields = input.extractedFields.filter(
    (field) => !TECHNICAL_FIELD_KEYS.has(field.field_key),
  );
  const map = fieldMap(entityFields);
  const entities = entitiesFromFields(map);
  const documentType = (input.document.document_type ??
    "unknown") as DocumentType;
  const legalAttentionRequired =
    readField(map, "legal_attention_required") === "true";
  const indicators = parseLegalIndicators(
    readField(map, "legal_attention_indicators"),
  );
  const confidence = Number(readField(map, "classification_confidence") ?? "0.5");

  const cards = buildAnalysisCards({
    classification: {
      documentType,
      confidence: Number.isFinite(confidence) ? confidence : 0.5,
      label: DOCUMENT_TYPE_LABELS[documentType] ?? DOCUMENT_TYPE_LABELS.unknown,
    },
    entities,
    legalAttention: {
      legalAttentionRequired,
      indicators,
    },
  });

  const actions = parseRecommendedActions(input.run.recommended_actions);

  return {
    documentSummary: input.run.plain_language_summary,
    whoSentIt: cards.whoSentIt,
    importantDates: cards.importantDates,
    whatMinaNoticed: input.run.what_mina_sees
      ? input.run.what_mina_sees.split("\n").filter(Boolean)
      : cards.whatMinaNoticed,
    recommendedNextStep:
      actions.find((action) => action.priority === "primary") ??
      cards.recommendedNextStep,
    supportingActions: actions.filter((action) => action.priority === "secondary"),
  };
}

export function isLegalAttentionRequired(
  extractedFields: DocumentExtractedField[],
): boolean {
  const match = extractedFields.find(
    (field) => field.field_key === "legal_attention_required",
  );

  return match?.field_value === "true";
}
