"use server";

import { z } from "zod";

import {
  appendExportMetadata,
  buildExportStoragePath,
  getExportContentType,
  mergeRecipientSnapshotWithExportMetadata,
  parseExportMetadata,
} from "@/lib/letters/export/export-metadata";
import {
  buildLetterExportBuffer,
  buildLetterExportDocumentInput,
} from "@/lib/letters/export/build-export-buffer";
import { parseLetterVersionContent } from "@/lib/letters/generate-letter-content";
import { createClient } from "@/lib/supabase/server";
import { LETTER_EXPORT_FORMATS, type LetterExportFormat } from "@/lib/letters/export/types";
import type { LetterExportMetadata } from "@/lib/letters/export/types";

const exportLetterSchema = z.object({
  letterId: z.string().uuid(),
  format: z.enum(LETTER_EXPORT_FORMATS),
});

export type ExportLetterResult =
  | {
      status: "success";
      downloadUrl: string;
      fileName: string;
      exportMetadata: LetterExportMetadata;
    }
  | {
      status: "error";
      message: string;
    };

function parseRecipientSnapshot(value: unknown): {
  name: string;
  address: string | null;
  snapshot: Record<string, unknown>;
} {
  const snapshot =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    name: typeof snapshot.name === "string" ? snapshot.name : "Account Review Department",
    address: typeof snapshot.address === "string" ? snapshot.address : null,
    snapshot,
  };
}

function buildDownloadFileName(input: {
  letterType: string;
  format: LetterExportFormat;
  exportedAt: string;
}): string {
  const timestamp = input.exportedAt.slice(0, 10);

  return `mina-${input.letterType}-${timestamp}.${input.format}`;
}

export async function exportLetter(input: {
  letterId: string;
  format: LetterExportFormat;
}): Promise<ExportLetterResult> {
  const parsed = exportLetterSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid export request.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const { data: letter, error: letterError } = await supabase
    .from("letters")
    .select(
      "id, letter_type, current_version, recipient_snapshot, export_storage_path, export_format",
    )
    .eq("id", parsed.data.letterId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (letterError) {
    return { status: "error", message: letterError.message };
  }

  if (!letter) {
    return { status: "error", message: "Letter not found." };
  }

  const { data: version, error: versionError } = await supabase
    .from("letter_versions")
    .select("content")
    .eq("letter_id", letter.id)
    .eq("version_number", letter.current_version)
    .maybeSingle();

  if (versionError) {
    return { status: "error", message: versionError.message };
  }

  if (!version) {
    return { status: "error", message: "Letter version not found." };
  }

  const content = parseLetterVersionContent(version.content);

  if (!content) {
    return { status: "error", message: "Letter content is invalid." };
  }

  const recipient = parseRecipientSnapshot(letter.recipient_snapshot);
  const exportedAt = new Date().toISOString();
  const exportDocument = buildLetterExportDocumentInput({
    content,
    recipientName: recipient.name,
    recipientAddress: recipient.address,
    exportedAt,
  });

  let exportBuffer: Uint8Array;

  try {
    exportBuffer = await buildLetterExportBuffer({
      format: parsed.data.format,
      document: exportDocument,
    });
  } catch (exportError) {
    return {
      status: "error",
      message:
        exportError instanceof Error
          ? exportError.message
          : "Failed to generate export file.",
    };
  }

  const storagePath = buildExportStoragePath({
    userId: user.id,
    letterId: letter.id,
    format: parsed.data.format,
    exportedAt,
  });

  const { error: uploadError } = await supabase.storage
    .from("letter_exports")
    .upload(storagePath, exportBuffer, {
      contentType: getExportContentType(parsed.data.format),
      upsert: false,
    });

  if (uploadError) {
    return { status: "error", message: uploadError.message };
  }

  const existingMetadata = parseExportMetadata(recipient.snapshot);
  const exportMetadata = appendExportMetadata({
    existing: existingMetadata,
    exportedAt,
    format: parsed.data.format,
    storagePath,
  });

  const { error: updateError } = await supabase
    .from("letters")
    .update({
      status: "exported",
      export_storage_path: storagePath,
      export_format: parsed.data.format,
      recipient_snapshot: mergeRecipientSnapshotWithExportMetadata({
        recipientSnapshot: recipient.snapshot,
        exportMetadata,
      }),
    })
    .eq("id", letter.id)
    .eq("user_id", user.id);

  if (updateError) {
    return { status: "error", message: updateError.message };
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("letter_exports")
    .createSignedUrl(storagePath, 60 * 10);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return {
      status: "error",
      message: signedUrlError?.message ?? "Failed to create download link.",
    };
  }

  return {
    status: "success",
    downloadUrl: signedUrlData.signedUrl,
    fileName: buildDownloadFileName({
      letterType: letter.letter_type,
      format: parsed.data.format,
      exportedAt,
    }),
    exportMetadata,
  };
}
