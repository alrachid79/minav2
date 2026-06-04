import type { LegalAttentionIssueType } from "@/lib/documents/intelligence/types";
import { readConfirmedFieldValue } from "@/lib/documents/integration/confirmed-field-utils";
import { parseTimelineDate } from "@/lib/documents/integration/timeline/parse-date";
import type { DocumentConfirmedData } from "@/types/document-confirm";

export const LEGAL_ATTENTION_SEVERITIES = ["high", "medium", "low"] as const;

export type LegalAttentionEventSeverity =
  (typeof LEGAL_ATTENTION_SEVERITIES)[number];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isCourtDateWithin30Days(confirmedData: DocumentConfirmedData): boolean {
  const courtDateValue = readConfirmedFieldValue(confirmedData.court_date);

  if (!courtDateValue) {
    return false;
  }

  const parsed = parseTimelineDate(courtDateValue);

  if (!parsed) {
    return false;
  }

  const courtTime = new Date(parsed).getTime();
  const now = Date.now();

  return courtTime >= now && courtTime - now <= THIRTY_DAYS_MS;
}

export function assignLegalAttentionSeverity(input: {
  issueType: LegalAttentionIssueType;
  confirmedData: DocumentConfirmedData;
}): LegalAttentionEventSeverity {
  switch (input.issueType) {
    case "summons":
    case "garnishment":
    case "irs_enforcement":
      return "high";
    case "court_date":
      return isCourtDateWithin30Days(input.confirmedData) ? "high" : "medium";
    case "lawsuit":
    case "judgment":
      return "medium";
    default:
      return "low";
  }
}

export const DOCUMENT_ANALYSIS_LEGAL_SOURCE_FEATURE = "document_analysis";
