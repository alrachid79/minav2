import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  DOCUMENTS_BUCKET,
  HEIC_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/documents/constants";
import type { DocumentRecord } from "@/types/documents";

export interface FileValidationResult {
  valid: true;
  mimeType: string;
  isHeic: boolean;
}

export interface FileValidationError {
  valid: false;
  message: string;
}

export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "document";
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);

  return sanitized.length > 0 ? sanitized : "document";
}

export function resolveMimeType(file: File): string | null {
  const normalizedType = file.type.toLowerCase();

  if (
    ALLOWED_MIME_TYPES.includes(
      normalizedType as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return normalizedType;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension) {
    return null;
  }

  if (!ALLOWED_FILE_EXTENSIONS.includes(
    extension as (typeof ALLOWED_FILE_EXTENSIONS)[number],
  )) {
    return null;
  }

  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return null;
  }
}

export function validateDocumentFile(
  file: File,
): FileValidationResult | FileValidationError {
  if (file.size <= 0) {
    return { valid: false, message: "This file appears to be empty." };
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      message: "This file is too large. Maximum size is 25 MB.",
    };
  }

  const mimeType = resolveMimeType(file);

  if (!mimeType) {
    return {
      valid: false,
      message:
        "Unsupported file type. Please upload a PDF, JPG, PNG, or HEIC file.",
    };
  }

  return {
    valid: true,
    mimeType,
    isHeic: HEIC_MIME_TYPES.has(mimeType),
  };
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return { url, anonKey };
}

async function uploadFileWithProgress(input: {
  supabase: SupabaseClient;
  path: string;
  file: File;
  mimeType: string;
  onProgress: (percent: number) => void;
}): Promise<void> {
  const {
    data: { session },
  } = await input.supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in to upload documents.");
  }

  const { url: supabaseUrl, anonKey } = getSupabaseEnv();

  const encodedPath = input.path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${DOCUMENTS_BUCKET}/${encodedPath}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        input.onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress(100);
        resolve();
        return;
      }

      reject(new Error(xhr.responseText || "Storage upload failed."));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error while uploading."));
    });

    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", input.mimeType);
    xhr.send(input.file);
  });
}

function getHeicUploadErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("mime") || message.includes("type") || message.includes("invalid")) {
    return "HEIC files aren't supported in this browser yet. Try saving the photo as JPG or PDF and upload again.";
  }

  return "Upload failed. If this is a HEIC photo, try saving it as JPG or PDF.";
}

export async function uploadDocument(input: {
  supabase: SupabaseClient;
  file: File;
  onProgress: (percent: number) => void;
}): Promise<DocumentRecord> {
  const validation = validateDocumentFile(input.file);

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const {
    data: { user },
    error: authError,
  } = await input.supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to upload documents.");
  }

  const documentId = crypto.randomUUID();
  const safeFilename = sanitizeFilename(input.file.name);
  const storagePath = `${user.id}/${documentId}/${safeFilename}`;

  input.onProgress(5);

  const { data: documentRow, error: insertError } = await input.supabase
    .from("documents")
    .insert({
      id: documentId,
      user_id: user.id,
      original_filename: input.file.name,
      mime_type: validation.mimeType,
      file_size_bytes: input.file.size,
      storage_bucket: DOCUMENTS_BUCKET,
      storage_path: storagePath,
      upload_status: "uploading",
    })
    .select(
      "id, user_id, original_filename, mime_type, file_size_bytes, storage_bucket, storage_path, upload_status, page_count, created_at",
    )
    .single();

  if (insertError || !documentRow) {
    throw new Error(insertError?.message ?? "Failed to create document record.");
  }

  input.onProgress(15);

  try {
    await uploadFileWithProgress({
      supabase: input.supabase,
      path: storagePath,
      file: input.file,
      mimeType: validation.mimeType,
      onProgress: (percent) => {
        input.onProgress(15 + Math.round(percent * 0.8));
      },
    });
  } catch (error) {
    await input.supabase
      .from("documents")
      .update({ upload_status: "failed" })
      .eq("id", documentId);

    if (validation.isHeic) {
      throw new Error(getHeicUploadErrorMessage(error));
    }

    throw error instanceof Error ? error : new Error("Upload failed.");
  }

  const { data: readyDocument, error: updateError } = await input.supabase
    .from("documents")
    .update({ upload_status: "ready" })
    .eq("id", documentId)
    .select(
      "id, user_id, original_filename, mime_type, file_size_bytes, storage_bucket, storage_path, upload_status, page_count, created_at",
    )
    .single();

  if (updateError || !readyDocument) {
    throw new Error(updateError?.message ?? "Failed to finalize document upload.");
  }

  input.onProgress(100);

  console.info("[MINA_DIAG] uploadDocument success", {
    documentId: readyDocument.id,
    userId: readyDocument.user_id,
    uploadStatus: readyDocument.upload_status,
    storagePath: readyDocument.storage_path,
  });

  return readyDocument as DocumentRecord;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
