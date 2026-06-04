export const MAX_DOCUMENT_PAGE_COUNT = 50;

export const MIN_EXTRACTED_TEXT_LENGTH = 12;

export const EXTRACTION_METADATA_KEYS = {
  method: "extraction_method",
  characterCount: "character_count",
  wordCount: "word_count",
  pageCount: "page_count",
  sourceMimeType: "source_mime_type",
  heicConverted: "heic_converted",
  processingDurationMs: "processing_duration_ms",
  ocrLanguage: "ocr_language",
  extractionError: "extraction_error",
} as const;

export type ExtractionMethod =
  | "pdf_text_layer"
  | "image_ocr"
  | "heic_converted_ocr";
