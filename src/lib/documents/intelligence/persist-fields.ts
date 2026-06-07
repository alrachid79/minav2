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

  const confidence = intelligence.entityConfidences;

  const fields = [
    field(
      ENTITY_FIELD_KEYS.classificationConfidence,
      String(classification.confidence.toFixed(2)),
      classification.confidence,
    ),
    field(
      ENTITY_FIELD_KEYS.senderName,
      entities.senderName,
      confidence.senderName,
    ),
    field(
      ENTITY_FIELD_KEYS.collectorName,
      entities.collectorName,
      confidence.collectorName,
    ),
    field(
      ENTITY_FIELD_KEYS.creditorName,
      entities.creditorName,
      confidence.creditorName,
    ),
    field(
      ENTITY_FIELD_KEYS.balanceAmount,
      entities.balanceAmount,
      confidence.balanceAmount,
    ),
    field(
      ENTITY_FIELD_KEYS.balanceCurrency,
      entities.balanceCurrency,
      confidence.balanceCurrency,
    ),
    field(
      ENTITY_FIELD_KEYS.accountReference,
      entities.accountReference,
      confidence.accountReference,
    ),
    field(
      ENTITY_FIELD_KEYS.documentDate,
      entities.documentDate,
      confidence.documentDate,
    ),
    field(
      ENTITY_FIELD_KEYS.responseDeadline,
      entities.responseDeadline,
      confidence.responseDeadline,
    ),
    field(
      ENTITY_FIELD_KEYS.courtDate,
      entities.courtDate,
      confidence.courtDate,
    ),
    field(
      ENTITY_FIELD_KEYS.contactPhone,
      entities.contactPhone,
      confidence.contactPhone,
    ),
    field(
      ENTITY_FIELD_KEYS.contactEmail,
      entities.contactEmail,
      confidence.contactEmail,
    ),
    field(
      ENTITY_FIELD_KEYS.contactAddress,
      entities.contactAddress,
      confidence.contactAddress,
    ),
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
