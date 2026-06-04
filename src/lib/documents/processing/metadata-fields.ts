import "server-only";

import { EXTRACTION_METADATA_KEYS } from "@/lib/documents/processing/constants";
import type { ExtractionMetadata } from "@/lib/documents/processing/extract-text";

export interface MetadataFieldInsert {
  field_key: string;
  field_value: string;
}

export function buildExtractionMetadataFields(
  metadata: ExtractionMetadata,
): MetadataFieldInsert[] {
  return [
    {
      field_key: EXTRACTION_METADATA_KEYS.method,
      field_value: metadata.method,
    },
    {
      field_key: EXTRACTION_METADATA_KEYS.characterCount,
      field_value: String(metadata.characterCount),
    },
    {
      field_key: EXTRACTION_METADATA_KEYS.wordCount,
      field_value: String(metadata.wordCount),
    },
    {
      field_key: EXTRACTION_METADATA_KEYS.pageCount,
      field_value:
        metadata.pageCount === null ? "" : String(metadata.pageCount),
    },
    {
      field_key: EXTRACTION_METADATA_KEYS.sourceMimeType,
      field_value: metadata.sourceMimeType,
    },
    {
      field_key: EXTRACTION_METADATA_KEYS.heicConverted,
      field_value: metadata.heicConverted ? "true" : "false",
    },
    {
      field_key: EXTRACTION_METADATA_KEYS.processingDurationMs,
      field_value: String(metadata.processingDurationMs),
    },
    {
      field_key: EXTRACTION_METADATA_KEYS.ocrLanguage,
      field_value: metadata.ocrLanguage ?? "",
    },
  ];
}

export function buildExtractionErrorField(message: string): MetadataFieldInsert {
  return {
    field_key: EXTRACTION_METADATA_KEYS.extractionError,
    field_value: message,
  };
}
