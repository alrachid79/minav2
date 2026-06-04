import "server-only";

import { buildLetterDocx } from "@/lib/letters/export/build-docx";
import { buildLetterPdf } from "@/lib/letters/export/build-pdf";
import type {
  LetterExportDocumentInput,
  LetterExportFormat,
} from "@/lib/letters/export/types";

export async function buildLetterExportBuffer(input: {
  format: LetterExportFormat;
  document: LetterExportDocumentInput;
}): Promise<Uint8Array> {
  if (input.format === "pdf") {
    return buildLetterPdf(input.document);
  }

  const docxBuffer = await buildLetterDocx(input.document);

  return new Uint8Array(docxBuffer);
}

export function buildLetterExportDocumentInput(input: {
  content: {
    subject: string;
    greeting: string;
    body: string;
    closing: string;
    disclaimer: string;
    letter_type_label: string;
  };
  recipientName: string;
  recipientAddress: string | null;
  exportedAt: string;
}): LetterExportDocumentInput {
  return {
    recipientName: input.recipientName,
    recipientAddress: input.recipientAddress,
    exportedAt: input.exportedAt,
    subject: input.content.subject,
    greeting: input.content.greeting,
    body: input.content.body,
    closing: input.content.closing,
    disclaimer: input.content.disclaimer,
    letterTypeLabel: input.content.letter_type_label,
  };
}
