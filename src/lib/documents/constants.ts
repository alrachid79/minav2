export const DOCUMENTS_BUCKET = "documents";

/** 25 MB — matches supabase-schema.sql CHECK and storage bucket limit */
export const MAX_DOCUMENT_SIZE_BYTES = 26_214_400;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
] as const;

export const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "heic",
  "heif",
] as const;

export const ACCEPTED_FILE_INPUT =
  ".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/jpeg,image/png,image/heic,image/heif";

export const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);
