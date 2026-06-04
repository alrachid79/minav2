import "server-only";

import { ENTITY_FIELD_KEYS } from "@/lib/documents/intelligence/field-keys";
import type {
  DocumentIntelligenceResult,
  EntityFieldInsert,
} from "@/lib/documents/intelligence/types";

function field(
  key: string,
  value: string | null | undefined,
  confidence: number | null = null,
): EntityFieldInsert | null {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return {
    field_key: key,
    field_value: value.trim(),
    confidence_score: confidence,
  };
}

export function buildIntelligenceFieldInserts(
  intelligence: DocumentIntelligenceResult,
): EntityFieldInsert[] {
  const { entities, classification, legalAttention } = intelligence;

  const fields = [
    field(
      ENTITY_FIELD_KEYS.classificationConfidence,
      String(classification.confidence.toFixed(2)),
      classification.confidence,
    ),
    field(ENTITY_FIELD_KEYS.senderName, entities.senderName, 0.65),
    field(ENTITY_FIELD_KEYS.collectorName, entities.collectorName, 0.7),
    field(ENTITY_FIELD_KEYS.creditorName, entities.creditorName, 0.7),
    field(ENTITY_FIELD_KEYS.balanceAmount, entities.balanceAmount, 0.75),
    field(ENTITY_FIELD_KEYS.balanceCurrency, entities.balanceCurrency, 0.9),
    field(ENTITY_FIELD_KEYS.accountReference, entities.accountReference, 0.72),
    field(ENTITY_FIELD_KEYS.documentDate, entities.documentDate, 0.68),
    field(ENTITY_FIELD_KEYS.responseDeadline, entities.responseDeadline, 0.7),
    field(ENTITY_FIELD_KEYS.courtDate, entities.courtDate, 0.72),
    field(ENTITY_FIELD_KEYS.contactPhone, entities.contactPhone, 0.85),
    field(ENTITY_FIELD_KEYS.contactEmail, entities.contactEmail, 0.88),
    field(ENTITY_FIELD_KEYS.contactAddress, entities.contactAddress, 0.6),
    {
      field_key: ENTITY_FIELD_KEYS.legalAttentionRequired,
      field_value: legalAttention.legalAttentionRequired ? "true" : "false",
      confidence_score: legalAttention.legalAttentionRequired ? 0.9 : 0.95,
    },
    {
      field_key: ENTITY_FIELD_KEYS.legalAttentionIndicators,
      field_value: JSON.stringify(legalAttention.indicators),
      confidence_score: legalAttention.legalAttentionRequired ? 0.88 : null,
    },
  ];

  return fields.filter((item): item is EntityFieldInsert => item !== null);
}
