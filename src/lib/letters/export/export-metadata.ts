import type {
  LetterExportFormat,
  LetterExportHistoryEntry,
  LetterExportMetadata,
} from "@/lib/letters/export/types";

const EMPTY_EXPORT_METADATA: LetterExportMetadata = {
  count: 0,
  history: [],
  last_exported_at: null,
  last_export_format: null,
};

export function parseExportMetadata(
  recipientSnapshot: Record<string, unknown> | null,
): LetterExportMetadata {
  if (!recipientSnapshot || typeof recipientSnapshot !== "object") {
    return EMPTY_EXPORT_METADATA;
  }

  const raw = recipientSnapshot.export_metadata;

  if (!raw || typeof raw !== "object") {
    return EMPTY_EXPORT_METADATA;
  }

  const metadata = raw as Partial<LetterExportMetadata>;
  const history = Array.isArray(metadata.history)
    ? metadata.history.filter(isValidHistoryEntry)
    : [];

  return {
    count: typeof metadata.count === "number" ? metadata.count : history.length,
    history,
    last_exported_at:
      typeof metadata.last_exported_at === "string"
        ? metadata.last_exported_at
        : history[history.length - 1]?.exported_at ?? null,
    last_export_format:
      metadata.last_export_format === "pdf" || metadata.last_export_format === "docx"
        ? metadata.last_export_format
        : (history[history.length - 1]?.format ?? null),
  };
}

function isValidHistoryEntry(value: unknown): value is LetterExportHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<LetterExportHistoryEntry>;

  return (
    typeof entry.exported_at === "string" &&
    (entry.format === "pdf" || entry.format === "docx") &&
    typeof entry.storage_path === "string"
  );
}

export function appendExportMetadata(input: {
  existing: LetterExportMetadata;
  exportedAt: string;
  format: LetterExportFormat;
  storagePath: string;
}): LetterExportMetadata {
  const historyEntry: LetterExportHistoryEntry = {
    exported_at: input.exportedAt,
    format: input.format,
    storage_path: input.storagePath,
  };

  const history = [...input.existing.history, historyEntry];

  return {
    count: history.length,
    history,
    last_exported_at: input.exportedAt,
    last_export_format: input.format,
  };
}

export function mergeRecipientSnapshotWithExportMetadata(input: {
  recipientSnapshot: Record<string, unknown> | null;
  exportMetadata: LetterExportMetadata;
}): Record<string, unknown> {
  return {
    ...(input.recipientSnapshot ?? {}),
    export_metadata: input.exportMetadata,
  };
}

export function buildExportStoragePath(input: {
  userId: string;
  letterId: string;
  format: LetterExportFormat;
  exportedAt: string;
}): string {
  const timestamp = input.exportedAt.replace(/[:.]/g, "-");

  return `${input.userId}/letters/${input.letterId}/mina-letter-${timestamp}.${input.format}`;
}

export function getExportContentType(format: LetterExportFormat): string {
  return format === "pdf"
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}
