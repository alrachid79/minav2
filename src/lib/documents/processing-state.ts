import { isDashboardIntelligenceIntegrationComplete } from "@/lib/documents/integration/dashboard-intelligence/dashboard-intelligence-summary";
import { isEntityIntegrationComplete } from "@/lib/documents/integration/entity-summary";
import { isLegalAttentionIntegrationComplete } from "@/lib/documents/integration/legal-attention/legal-attention-summary";
import { isTimelineIntegrationComplete } from "@/lib/documents/integration/timeline/timeline-summary";
import type {
  DocumentAnalysisRun,
  DocumentProcessingState,
  DocumentRecord,
} from "@/types/documents";

export function deriveDocumentProcessingState(input: {
  document: Pick<
    DocumentRecord,
    "upload_status" | "confirmed_at" | "confirmed_data"
  >;
  latestRun: DocumentAnalysisRun | null;
}): DocumentProcessingState {
  if (input.document.upload_status === "failed") {
    return "failed";
  }

  if (input.document.upload_status === "uploading") {
    return "uploading";
  }

  if (input.document.confirmed_at) {
    if (
      isEntityIntegrationComplete(input.document.confirmed_data) &&
      isTimelineIntegrationComplete(input.document.confirmed_data) &&
      isLegalAttentionIntegrationComplete(input.document.confirmed_data) &&
      isDashboardIntelligenceIntegrationComplete(input.document.confirmed_data)
    ) {
      return "integrated";
    }

    return "confirmed";
  }

  if (!input.latestRun) {
    return "uploaded";
  }

  if (input.latestRun.status === "pending") {
    return "processing";
  }

  if (input.latestRun.status === "completed") {
    if (input.latestRun.plain_language_summary) {
      return "analyzed";
    }

    return "extracted";
  }

  return "failed";
}

export function getProcessingStateLabel(state: DocumentProcessingState): string {
  switch (state) {
    case "uploading":
      return "Uploading";
    case "uploaded":
      return "Uploaded — queued for processing";
    case "processing":
      return "Processing";
    case "extracted":
      return "Text extracted";
    case "analyzed":
      return "Analysis complete";
    case "confirmed":
      return "Confirmed — pending integration";
    case "integrated":
      return "Integrated";
    case "failed":
      return "Processing failed";
    default:
      return "Unknown";
  }
}
