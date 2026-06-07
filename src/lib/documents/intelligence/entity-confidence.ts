import type { ExtractedEntities } from "@/lib/documents/intelligence/types";

export type EntityConfidenceMap = Record<keyof ExtractedEntities, number | null>;

export const ENTITY_REVIEW_CONFIDENCE_THRESHOLD = 0.65;

export function createEmptyConfidenceMap(): EntityConfidenceMap {
  return {
    senderName: null,
    collectorName: null,
    creditorName: null,
    balanceAmount: null,
    balanceCurrency: null,
    accountReference: null,
    documentDate: null,
    responseDeadline: null,
    courtDate: null,
    contactPhone: null,
    contactEmail: null,
    contactAddress: null,
  };
}

export function setConfidence(
  map: EntityConfidenceMap,
  key: keyof ExtractedEntities,
  confidence: number,
): void {
  const existing = map[key];

  if (existing === null || confidence > existing) {
    map[key] = confidence;
  }
}
