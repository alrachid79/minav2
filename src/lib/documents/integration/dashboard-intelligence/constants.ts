export const DOCUMENT_ANALYSIS_DASHBOARD_SOURCE_FEATURE = "document_analysis";

export const DOCUMENT_RECOMMENDATION_KEYS = [
  "collection_letter_review",
  "settlement_offer_review",
  "court_notice_review",
  "irs_notice_review",
  "deadline_review",
  "legal_attention_review",
] as const;

export type DocumentRecommendationKey =
  (typeof DOCUMENT_RECOMMENDATION_KEYS)[number];

export const RECOMMENDATION_URGENCY_ORDER: Record<DocumentRecommendationKey, number> =
  {
    legal_attention_review: 1,
    court_notice_review: 2,
    deadline_review: 3,
    irs_notice_review: 4,
    settlement_offer_review: 5,
    collection_letter_review: 6,
  };
