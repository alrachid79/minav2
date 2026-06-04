import type { DocumentType } from "@/lib/documents/intelligence/types";

export function mapDocumentTypeToDebtCategory(
  documentType: DocumentType,
): string {
  switch (documentType) {
    case "collection_letter":
    case "settlement_offer":
    case "debt_validation_response":
      return "collections";
    case "medical_billing_notice":
      return "medical";
    case "irs_notice":
      return "tax";
    case "court_lawsuit_notice":
      return "legal";
    default:
      return "other";
  }
}

const DEBT_RELATED_DOCUMENT_TYPES = new Set<DocumentType>([
  "collection_letter",
  "settlement_offer",
  "medical_billing_notice",
  "irs_notice",
  "court_lawsuit_notice",
  "debt_validation_response",
]);

export function isDebtRelatedDocumentType(documentType: DocumentType): boolean {
  return DEBT_RELATED_DOCUMENT_TYPES.has(documentType);
}
