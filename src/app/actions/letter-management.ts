"use server";

import { z } from "zod";

import { appendLetterVersion } from "@/lib/letters/append-letter-version";
import {
  buildEditedLetterContent,
  buildRegeneratedLetterContent,
} from "@/lib/letters/letter-version-service";
import { parseExportMetadata } from "@/lib/letters/export/export-metadata";
import { parseLetterVersionContent } from "@/lib/letters/generate-letter-content";
import { LETTER_TYPE_LABELS, LETTER_STATUS_LABELS } from "@/lib/letters/constants";
import { createClient } from "@/lib/supabase/server";
import {
  LETTER_TYPES,
  type LetterListItem,
  type LetterStatus,
  type LetterType,
  type LetterVersionSummary,
} from "@/types/letters";

const letterIdSchema = z.object({
  letterId: z.string().uuid(),
});

const saveLetterEditsSchema = z.object({
  letterId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  greeting: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
  closing: z.string().min(1).max(2000),
});

export type ListLettersResult =
  | { status: "success"; letters: LetterListItem[] }
  | { status: "error"; message: string };

export type LetterVersionActionResult =
  | { status: "success"; versionNumber: number }
  | { status: "error"; message: string };

export type GetLetterVersionsResult =
  | { status: "success"; versions: LetterVersionSummary[]; currentVersion: number }
  | { status: "error"; message: string };

export async function listMyLetters(): Promise<ListLettersResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("letters")
    .select(
      "id, letter_type, status, created_at, current_version, document_id, recipient_snapshot, documents ( original_filename )",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { status: "error", message: error.message };
  }

  const letters: LetterListItem[] = (data ?? []).map((row) => {
    const letterType = row.letter_type as LetterType;
    const exportMetadata = parseExportMetadata(
      (row.recipient_snapshot as Record<string, unknown> | null) ?? null,
    );
    const documentRelation = row.documents as
      | { original_filename: string }
      | { original_filename: string }[]
      | null;
    const linkedDocument = Array.isArray(documentRelation)
      ? documentRelation[0]
      : documentRelation;

    return {
      id: row.id,
      letter_type: letterType,
      letter_type_label: LETTER_TYPE_LABELS[letterType] ?? row.letter_type,
      status: row.status as LetterStatus,
      status_label: LETTER_STATUS_LABELS[row.status as LetterStatus] ?? row.status,
      created_at: row.created_at,
      last_exported_at: exportMetadata.last_exported_at,
      document_filename: linkedDocument?.original_filename ?? null,
      current_version: row.current_version,
    };
  });

  return { status: "success", letters };
}

export async function getLetterVersions(input: {
  letterId: string;
}): Promise<GetLetterVersionsResult> {
  const parsed = letterIdSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid letter id.",
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
    .select("id, current_version")
    .eq("id", parsed.data.letterId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (letterError) {
    return { status: "error", message: letterError.message };
  }

  if (!letter) {
    return { status: "error", message: "Letter not found." };
  }

  const { data: versions, error: versionsError } = await supabase
    .from("letter_versions")
    .select("id, version_number, change_reason, created_at")
    .eq("letter_id", letter.id)
    .order("version_number", { ascending: false });

  if (versionsError) {
    return { status: "error", message: versionsError.message };
  }

  return {
    status: "success",
    currentVersion: letter.current_version,
    versions: (versions ?? []).map((version) => ({
      id: version.id,
      version_number: version.version_number,
      change_reason: version.change_reason,
      created_at: version.created_at,
    })),
  };
}

export async function regenerateLetter(input: {
  letterId: string;
}): Promise<LetterVersionActionResult> {
  const parsed = letterIdSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid letter id.",
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
      "id, letter_type, document_id, collector_id, debt_situation_id, letter_template_id, recipient_snapshot",
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

  if (!LETTER_TYPES.includes(letter.letter_type as LetterType)) {
    return { status: "error", message: "Unsupported letter type." };
  }

  try {
    const generatedAt = new Date().toISOString();
    const content = await buildRegeneratedLetterContent({
      supabase,
      userId: user.id,
      letter: {
        letter_type: letter.letter_type as LetterType,
        document_id: letter.document_id,
        collector_id: letter.collector_id,
        debt_situation_id: letter.debt_situation_id,
        letter_template_id: letter.letter_template_id,
        recipient_snapshot:
          (letter.recipient_snapshot as Record<string, unknown> | null) ?? null,
      },
      generatedAt,
    });

    const { versionNumber } = await appendLetterVersion({
      supabase,
      userId: user.id,
      letterId: letter.id,
      content,
      changeReason: "revised",
    });

    return { status: "success", versionNumber };
  } catch (regenerateError) {
    return {
      status: "error",
      message:
        regenerateError instanceof Error
          ? regenerateError.message
          : "Failed to regenerate letter.",
    };
  }
}

export async function saveLetterEdits(input: {
  letterId: string;
  subject: string;
  greeting: string;
  body: string;
  closing: string;
}): Promise<LetterVersionActionResult> {
  const parsed = saveLetterEditsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid edit payload.",
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
    .select("id, current_version")
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
    return { status: "error", message: "Current letter version not found." };
  }

  const currentContent = parseLetterVersionContent(version.content);

  if (!currentContent) {
    return { status: "error", message: "Letter content is invalid." };
  }

  const editedAt = new Date().toISOString();
  const content = buildEditedLetterContent({
    current: currentContent,
    edits: {
      subject: parsed.data.subject,
      greeting: parsed.data.greeting,
      body: parsed.data.body,
      closing: parsed.data.closing,
    },
    editedAt,
  });

  try {
    const { versionNumber } = await appendLetterVersion({
      supabase,
      userId: user.id,
      letterId: letter.id,
      content,
      changeReason: "edited",
    });

    return { status: "success", versionNumber };
  } catch (saveError) {
    return {
      status: "error",
      message:
        saveError instanceof Error ? saveError.message : "Failed to save edits.",
    };
  }
}
