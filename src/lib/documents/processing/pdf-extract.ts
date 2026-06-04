import "server-only";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { MAX_DOCUMENT_PAGE_COUNT } from "@/lib/documents/processing/constants";

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;

  if (pdf.numPages > MAX_DOCUMENT_PAGE_COUNT) {
    throw new Error(
      `This PDF has ${pdf.numPages} pages. Maximum supported is ${MAX_DOCUMENT_PAGE_COUNT} pages.`,
    );
  }

  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText.length > 0) {
      pageTexts.push(pageText);
    }
  }

  return {
    text: pageTexts.join("\n\n").trim(),
    pageCount: pdf.numPages,
  };
}
