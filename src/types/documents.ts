export const DOCUMENT_UPLOAD_STATUSES = [
  "uploading",
  "ready",
  "failed",
] as const;

export type DocumentUploadStatus = (typeof DOCUMENT_UPLOAD_STATUSES)[number];

export const DOCUMENT_ANALYSIS_RUN_STATUSES = [
  "pending",
  "completed",
  "failed",
] as const;

export type DocumentAnalysisRunStatus =
  (typeof DOCUMENT_ANALYSIS_RUN_STATUSES)[number];

/** User-facing pipeline state mapped from upload + analysis run tables. */
export type DocumentProcessingState =
  | "uploading"
  | "uploaded"
  | "processing"
  | "extracted"
  | "analyzed"
  | "confirmed"
  | "integrated"
  | "failed";

export interface DocumentRecord {
  id: string;
  user_id: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  storage_bucket: string;
  storage_path: string;
  upload_status: DocumentUploadStatus;
  page_count: number | null;
  document_type: string | null;
  risk_level: string | null;
  confirmed_at: string | null;
  confirmed_data: Record<string, unknown> | null;
  collector_id: string | null;
  creditor_id: string | null;
  debt_situation_id: string | null;
  created_at: string;
}

export interface RecommendedAction {
  priority: "primary" | "secondary";
  title: string;
  description: string;
}

export interface DocumentAnalysisRun {
  id: string;
  user_id: string;
  document_id: string;
  run_number: number;
  status: DocumentAnalysisRunStatus;
  extracted_text: string | null;
  plain_language_summary: string | null;
  what_mina_sees: string | null;
  recommended_actions: RecommendedAction[] | null;
  completed_at: string | null;
  created_at: string;
}

export interface DocumentExtractedField {
  field_key: string;
  field_value: string | null;
  confidence_score: number | null;
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

export interface DocumentProcessingSnapshot {
  document: DocumentRecord;
  latestRun: DocumentAnalysisRun | null;
  extractedFields: DocumentExtractedField[];
  cards: DocumentAnalysisCards | null;
  legalAttentionRequired: boolean;
  processingState: DocumentProcessingState;
}

export type ProcessDocumentResult =
  | {
      status: "success";
      snapshot: DocumentProcessingSnapshot;
    }
  | {
      status: "already_processing";
      snapshot: DocumentProcessingSnapshot;
    }
  | {
      status: "error";
      message: string;
      snapshot?: DocumentProcessingSnapshot;
    };

export type GetDocumentProcessingResult =
  | {
      status: "success";
      snapshot: DocumentProcessingSnapshot;
    }
  | {
      status: "error";
      message: string;
    };
