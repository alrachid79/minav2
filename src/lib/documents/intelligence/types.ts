export const DOCUMENT_TYPES = [
  "collection_letter",
  "settlement_offer",
  "medical_billing_notice",
  "irs_notice",
  "court_lawsuit_notice",
  "debt_validation_response",
  "unknown",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const LEGAL_ATTENTION_ISSUE_TYPES = [
  "lawsuit",
  "summons",
  "court_date",
  "garnishment",
  "judgment",
  "irs_enforcement",
] as const;

export type LegalAttentionIssueType =
  (typeof LEGAL_ATTENTION_ISSUE_TYPES)[number];

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  label: string;
}

export interface ExtractedEntities {
  senderName: string | null;
  collectorName: string | null;
  creditorName: string | null;
  balanceAmount: string | null;
  balanceCurrency: string | null;
  accountReference: string | null;
  documentDate: string | null;
  responseDeadline: string | null;
  courtDate: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
}

export interface LegalAttentionIndicator {
  issueType: LegalAttentionIssueType;
  matchedPhrase: string;
  confidence: number;
}

export interface LegalAttentionResult {
  legalAttentionRequired: boolean;
  indicators: LegalAttentionIndicator[];
}

export interface RecommendedAction {
  priority: "primary" | "secondary";
  title: string;
  description: string;
}

export interface DocumentAnalysisCards {
  documentSummary: string;
  whoSentIt: {
    senderName: string | null;
    collectorName: string | null;
    creditorName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    contactAddress: string | null;
  };
  importantDates: {
    documentDate: string | null;
    responseDeadline: string | null;
    courtDate: string | null;
  };
  whatMinaNoticed: string[];
  recommendedNextStep: RecommendedAction;
  supportingActions: RecommendedAction[];
}

export interface DocumentIntelligenceResult {
  classification: ClassificationResult;
  entities: ExtractedEntities;
  legalAttention: LegalAttentionResult;
  cards: DocumentAnalysisCards;
  plainLanguageSummary: string;
  whatMinaSees: string;
  recommendedActions: RecommendedAction[];
  riskLevel: "low" | "legal_attention_required";
}

export interface EntityFieldInsert {
  field_key: string;
  field_value: string;
  confidence_score: number | null;
}
