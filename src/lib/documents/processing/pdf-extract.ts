import "server-only";

import { MAX_DOCUMENT_PAGE_COUNT } from "@/lib/documents/processing/constants";

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

interface PdfParseResult {
  text: string;
  numpages: number;
}

type PdfParseFn = (buffer: Buffer) => Promise<PdfParseResult>;

async function loadPdfParse(): Promise<PdfParseFn> {
  const imported = await import("pdf-parse");
  const pdfParse = (imported as { default: PdfParseFn }).default;

  if (typeof pdfParse !== "function") {
    throw new Error("PDF parser failed to load.");
  }

  return pdfParse;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    const pdfParse = await loadPdfParse();
    const data = await pdfParse(buffer);

    if (data.numpages > MAX_DOCUMENT_PAGE_COUNT) {
      throw new Error(
        `This PDF has ${data.numpages} pages. Maximum supported is ${MAX_DOCUMENT_PAGE_COUNT} pages.`,
      );
    }

    const text = data.text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .filter((line) => line.length > 0)
      .join("\n");

    return {
      text,
      pageCount: data.numpages,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "PDF text extraction failed in the server environment.";

    throw new Error(message);
  }
}
