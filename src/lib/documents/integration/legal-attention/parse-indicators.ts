import { ENTITY_FIELD_KEYS } from "@/lib/documents/intelligence/field-keys";
import type {
  LegalAttentionIndicator,
  LegalAttentionIssueType,
} from "@/lib/documents/intelligence/types";
import type { DocumentExtractedField } from "@/types/documents";

const VALID_ISSUE_TYPES = new Set<LegalAttentionIssueType>([
  "lawsuit",
  "summons",
  "court_date",
  "garnishment",
  "judgment",
  "irs_enforcement",
]);

export function parseLegalAttentionIndicators(
  extractedFields: DocumentExtractedField[],
): LegalAttentionIndicator[] {
  const raw = extractedFields.find(
    (field) => field.field_key === ENTITY_FIELD_KEYS.legalAttentionIndicators,
  )?.field_value;

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as LegalAttentionIndicator[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (indicator) =>
        indicator &&
        typeof indicator.issueType === "string" &&
        VALID_ISSUE_TYPES.has(indicator.issueType as LegalAttentionIssueType),
    );
  } catch {
    return [];
  }
}

export function groupIndicatorsByIssueType(
  indicators: LegalAttentionIndicator[],
): Map<LegalAttentionIssueType, LegalAttentionIndicator[]> {
  const grouped = new Map<LegalAttentionIssueType, LegalAttentionIndicator[]>();

  for (const indicator of indicators) {
    const existing = grouped.get(indicator.issueType) ?? [];
    existing.push(indicator);
    grouped.set(indicator.issueType, existing);
  }

  return grouped;
}
