import "server-only";

import { HEIC_MIME_TYPES } from "@/lib/documents/constants";
import {
  MIN_EXTRACTED_TEXT_LENGTH,
  type ExtractionMethod,
} from "@/lib/documents/processing/constants";
import { convertHeicToJpeg } from "@/lib/documents/processing/heic-convert";
import { extractTextFromImage } from "@/lib/documents/processing/image-ocr";
import { extractTextFromPdf } from "@/lib/documents/processing/pdf-extract";

export interface ExtractionMetadata {
  method: ExtractionMethod;
  characterCount: number;
  wordCount: number;
  pageCount: number | null;
  sourceMimeType: string;
  heicConverted: boolean;
  processingDurationMs: number;
  ocrLanguage: string | null;
}

export interface ExtractionSuccess {
  ok: true;
  text: string;
  pageCount: number | null;
  metadata: ExtractionMetadata;
}

export interface ExtractionFailure {
  ok: false;
  message: string;
  metadata: Partial<ExtractionMetadata> & {
    sourceMimeType: string;
    processingDurationMs: number;
  };
}

export type ExtractionResult = ExtractionSuccess | ExtractionFailure;

function countWords(text: string): number {
  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

function buildMetadata(input: {
  method: ExtractionMethod;
  text: string;
  pageCount: number | null;
  sourceMimeType: string;
  heicConverted: boolean;
  startedAt: number;
  ocrLanguage: string | null;
}): ExtractionMetadata {
  return {
    method: input.method,
    characterCount: input.text.length,
    wordCount: countWords(input.text),
    pageCount: input.pageCount,
    sourceMimeType: input.sourceMimeType,
    heicConverted: input.heicConverted,
    processingDurationMs: Date.now() - input.startedAt,
    ocrLanguage: input.ocrLanguage,
  };
}

export async function extractDocumentText(input: {
  buffer: Buffer;
  mimeType: string;
}): Promise<ExtractionResult> {
  const startedAt = Date.now();
  const normalizedMime = input.mimeType.toLowerCase();
  let workingBuffer = input.buffer;
  let workingMime = normalizedMime;
  let heicConverted = false;

  try {
    if (HEIC_MIME_TYPES.has(normalizedMime)) {
      try {
        workingBuffer = await convertHeicToJpeg(input.buffer);
        workingMime = "image/jpeg";
        heicConverted = true;
      } catch {
        return {
          ok: false,
          message:
            "HEIC photos couldn't be converted on the server. Try saving the photo as JPG or PDF and upload again.",
          metadata: {
            sourceMimeType: normalizedMime,
            processingDurationMs: Date.now() - startedAt,
            heicConverted: false,
          },
        };
      }
    }

    if (workingMime === "application/pdf") {
      const pdfResult = await extractTextFromPdf(workingBuffer);

      if (pdfResult.text.length < MIN_EXTRACTED_TEXT_LENGTH) {
        return {
          ok: false,
          message:
            "Mina couldn't read much text from this PDF. If it's a scanned document, try uploading a clear photo (JPG or PNG) instead.",
          metadata: {
            sourceMimeType: normalizedMime,
            processingDurationMs: Date.now() - startedAt,
            pageCount: pdfResult.pageCount,
            method: "pdf_text_layer",
            heicConverted,
          },
        };
      }

      return {
        ok: true,
        text: pdfResult.text,
        pageCount: pdfResult.pageCount,
        metadata: buildMetadata({
          method: "pdf_text_layer",
          text: pdfResult.text,
          pageCount: pdfResult.pageCount,
          sourceMimeType: normalizedMime,
          heicConverted,
          startedAt,
          ocrLanguage: null,
        }),
      };
    }

    if (workingMime === "image/jpeg" || workingMime === "image/png") {
      const text = await extractTextFromImage(workingBuffer);

      if (text.length < MIN_EXTRACTED_TEXT_LENGTH) {
        return {
          ok: false,
          message:
            "Mina couldn't read enough text from this image. Try a clearer photo with good lighting and the full page in frame.",
          metadata: {
            sourceMimeType: normalizedMime,
            processingDurationMs: Date.now() - startedAt,
            heicConverted,
            method: heicConverted ? "heic_converted_ocr" : "image_ocr",
            ocrLanguage: "eng",
          },
        };
      }

      return {
        ok: true,
        text,
        pageCount: 1,
        metadata: buildMetadata({
          method: heicConverted ? "heic_converted_ocr" : "image_ocr",
          text,
          pageCount: 1,
          sourceMimeType: normalizedMime,
          heicConverted,
          startedAt,
          ocrLanguage: "eng",
        }),
      };
    }

    return {
      ok: false,
      message:
        "Unsupported file type for text extraction. Please upload a PDF, JPG, or PNG.",
      metadata: {
        sourceMimeType: normalizedMime,
        processingDurationMs: Date.now() - startedAt,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Text extraction failed unexpectedly.";

    return {
      ok: false,
      message,
      metadata: {
        sourceMimeType: normalizedMime,
        processingDurationMs: Date.now() - startedAt,
        heicConverted,
      },
    };
  }
}
