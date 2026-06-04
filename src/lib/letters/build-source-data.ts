import { readConfirmedFieldValue } from "@/lib/documents/integration/confirmed-field-utils";
import { parseConfirmedData } from "@/lib/documents/integration/metadata";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentExtractedField } from "@/types/documents";

export interface LetterGenerationSourceData {
  recipientName: string;
  recipientAddress: string | null;
  accountReference: string | null;
  balanceAmount: string | null;
  creditorName: string | null;
  documentDate: string | null;
  documentSummary: string | null;
  debtCategory: string | null;
}

function readExtractedField(
  fields: DocumentExtractedField[],
  key: string,
): string | null {
  const value = fields.find((field) => field.field_key === key)?.field_value;

  return value?.trim() ? value.trim() : null;
}

function readConfirmedDocumentFields(
  confirmedData: DocumentConfirmedData | null,
): Pick<
  LetterGenerationSourceData,
  "accountReference" | "balanceAmount" | "creditorName" | "documentDate"
> {
  if (!confirmedData) {
    return {
      accountReference: null,
      balanceAmount: null,
      creditorName: null,
      documentDate: null,
    };
  }

  return {
    accountReference: null,
    balanceAmount: readConfirmedFieldValue(confirmedData.balance_amount),
    creditorName: readConfirmedFieldValue(confirmedData.creditor_name),
    documentDate: readConfirmedFieldValue(confirmedData.document_date),
  };
}

export function buildLetterGenerationSourceData(input: {
  collectorName: string | null;
  collectorAddress: string | null;
  creditorName: string | null;
  debtCategory: string | null;
  confirmedData: Record<string, unknown> | null;
  extractedFields: DocumentExtractedField[];
  documentSummary: string | null;
}): LetterGenerationSourceData {
  const parsedConfirmed = parseConfirmedData(input.confirmedData);
  const confirmedFields = readConfirmedDocumentFields(parsedConfirmed);

  return {
    recipientName: input.collectorName ?? input.creditorName ?? "Account Review Department",
    recipientAddress: input.collectorAddress,
    accountReference:
      readExtractedField(input.extractedFields, "account_reference") ??
      confirmedFields.accountReference,
    balanceAmount:
      confirmedFields.balanceAmount ??
      readExtractedField(input.extractedFields, "balance_amount"),
    creditorName:
      confirmedFields.creditorName ??
      input.creditorName ??
      readExtractedField(input.extractedFields, "creditor_name"),
    documentDate:
      confirmedFields.documentDate ??
      readExtractedField(input.extractedFields, "document_date"),
    documentSummary:
      input.documentSummary ??
      parsedConfirmed?.document_summary ??
      null,
    debtCategory: input.debtCategory,
  };
}

export function buildSenderName(input: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const parts = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return input.email;
}
