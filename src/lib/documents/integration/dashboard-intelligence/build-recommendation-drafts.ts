import { readConfirmedFieldValue } from "@/lib/documents/integration/confirmed-field-utils";
import {
  RECOMMENDATION_URGENCY_ORDER,
  type DocumentRecommendationKey,
} from "@/lib/documents/integration/dashboard-intelligence/constants";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentType } from "@/lib/documents/intelligence/types";

export interface DashboardRecommendationDraft {
  recommendationKey: DocumentRecommendationKey;
  title: string;
  reason: string;
  targetFeature: string;
  urgencyOrder: number;
}

const RECOMMENDATION_COPY: Record<
  DocumentRecommendationKey,
  { title: string; reason: string; targetFeature: string }
> = {
  collection_letter_review: {
    title: "Review the document before responding.",
    reason:
      "You confirmed a collection letter. Review the details before taking any next steps.",
    targetFeature: "document_analysis",
  },
  settlement_offer_review: {
    title: "Review the offer before accepting or rejecting.",
    reason:
      "You confirmed a settlement offer. Review the terms before deciding how to respond.",
    targetFeature: "document_analysis",
  },
  court_notice_review: {
    title: "This document may require additional review.",
    reason:
      "You confirmed a court or lawsuit notice. Review the details carefully.",
    targetFeature: "document_analysis",
  },
  irs_notice_review: {
    title: "Review deadlines and notices carefully.",
    reason:
      "You confirmed an IRS notice. Review any listed deadlines and notices carefully.",
    targetFeature: "document_analysis",
  },
  deadline_review: {
    title: "Review your confirmed deadline.",
    reason:
      "You confirmed a response or court deadline. Review the date and plan accordingly.",
    targetFeature: "document_analysis",
  },
  legal_attention_review: {
    title: "Review items flagged for legal attention.",
    reason:
      "This document was flagged for legal attention based on language Mina detected. Review the details carefully.",
    targetFeature: "document_analysis",
  },
};

function hasDeadlineInformation(confirmedData: DocumentConfirmedData): boolean {
  return (
    readConfirmedFieldValue(confirmedData.response_deadline) !== null ||
    readConfirmedFieldValue(confirmedData.court_date) !== null
  );
}

function buildDraft(
  recommendationKey: DocumentRecommendationKey,
): DashboardRecommendationDraft {
  const copy = RECOMMENDATION_COPY[recommendationKey];

  return {
    recommendationKey,
    title: copy.title,
    reason: copy.reason,
    targetFeature: copy.targetFeature,
    urgencyOrder: RECOMMENDATION_URGENCY_ORDER[recommendationKey],
  };
}

export function buildDashboardRecommendationDrafts(input: {
  confirmedData: DocumentConfirmedData;
}): DashboardRecommendationDraft[] {
  const documentType = input.confirmedData.document_type;
  const drafts: DashboardRecommendationDraft[] = [];

  if (documentType === "collection_letter") {
    drafts.push(buildDraft("collection_letter_review"));
  }

  if (documentType === "settlement_offer") {
    drafts.push(buildDraft("settlement_offer_review"));
  }

  if (
    documentType === "court_lawsuit_notice" ||
    readConfirmedFieldValue(input.confirmedData.court_date) !== null
  ) {
    drafts.push(buildDraft("court_notice_review"));
  }

  if (documentType === "irs_notice") {
    drafts.push(buildDraft("irs_notice_review"));
  }

  if (hasDeadlineInformation(input.confirmedData)) {
    drafts.push(buildDraft("deadline_review"));
  }

  if (input.confirmedData.legal_attention_required) {
    drafts.push(buildDraft("legal_attention_review"));
  }

  return drafts.sort((left, right) => left.urgencyOrder - right.urgencyOrder);
}

export function assignRecommendationPriorities(
  drafts: DashboardRecommendationDraft[],
): Array<DashboardRecommendationDraft & { priority: "primary" | "secondary"; sortOrder: number }> {
  if (drafts.length === 0) {
    return [];
  }

  return drafts.map((draft, index) => ({
    ...draft,
    priority: index === 0 ? "primary" : "secondary",
    sortOrder: index + 1,
  }));
}

export type { DocumentType };
