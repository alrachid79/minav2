export const LETTER_EXPORT_FORMATS = ["pdf", "docx"] as const;

export type LetterExportFormat = (typeof LETTER_EXPORT_FORMATS)[number];

export interface LetterExportHistoryEntry {
  exported_at: string;
  format: LetterExportFormat;
  storage_path: string;
}

export interface LetterExportMetadata {
  count: number;
  history: LetterExportHistoryEntry[];
  last_exported_at: string | null;
  last_export_format: LetterExportFormat | null;
}

export interface LetterExportDocumentInput {
  recipientName: string;
  recipientAddress: string | null;
  exportedAt: string;
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  disclaimer: string;
  letterTypeLabel: string;
}
