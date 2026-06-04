"use server";

import { parseLetterVersionContent } from "@/lib/letters/generate-letter-content";
import { parseExportMetadata } from "@/lib/letters/export/export-metadata";
import { createClient } from "@/lib/supabase/server";
import type { GetLetterResult, LetterGeneratorContext, LetterRecord } from "@/types/letters";

export async function getLetterGeneratorContext(): Promise<
  LetterGeneratorContext | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const [
    profileResult,
    collectorsResult,
    creditorsResult,
    debtSituationsResult,
    documentsResult,
    templatesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, email, state")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("collectors")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("creditors")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("debt_situations")
      .select("id, label, category")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select(
        "id, original_filename, collector_id, creditor_id, debt_situation_id, confirmed_at",
      )
      .eq("user_id", user.id)
      .not("confirmed_at", "is", null)
      .order("confirmed_at", { ascending: false }),
    supabase
      .from("letter_templates")
      .select("id, letter_type, name, jurisdiction_scope, template_body, is_active, version")
      .eq("is_active", true)
      .order("letter_type"),
  ]);

  if (profileResult.error) {
    return { error: profileResult.error.message };
  }

  if (collectorsResult.error) {
    return { error: collectorsResult.error.message };
  }

  if (creditorsResult.error) {
    return { error: creditorsResult.error.message };
  }

  if (debtSituationsResult.error) {
    return { error: debtSituationsResult.error.message };
  }

  if (documentsResult.error) {
    return { error: documentsResult.error.message };
  }

  if (templatesResult.error) {
    return { error: templatesResult.error.message };
  }

  return {
    profile: {
      firstName: profileResult.data?.first_name ?? null,
      lastName: profileResult.data?.last_name ?? null,
      email: profileResult.data?.email ?? user.email ?? "",
      state: profileResult.data?.state ?? "",
    },
    collectors: (collectorsResult.data ?? []).map((collector) => ({
      id: collector.id,
      label: collector.name,
    })),
    creditors: (creditorsResult.data ?? []).map((creditor) => ({
      id: creditor.id,
      label: creditor.name,
    })),
    debtSituations: (debtSituationsResult.data ?? []).map((situation) => ({
      id: situation.id,
      label: situation.label ?? situation.category,
    })),
    documents: (documentsResult.data ?? []).map((document) => ({
      id: document.id,
      label: document.original_filename,
      collectorId: document.collector_id,
      creditorId: document.creditor_id,
      debtSituationId: document.debt_situation_id,
    })),
    templates: templatesResult.data ?? [],
  };
}

export async function getLetter(input: {
  letterId: string;
}): Promise<GetLetterResult> {
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
      "id, user_id, letter_type, status, document_id, debt_situation_id, collector_id, letter_template_id, recipient_snapshot, current_version, export_storage_path, export_format, created_at, updated_at",
    )
    .eq("id", input.letterId)
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
    .select("content, created_at")
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
    letter: letter as LetterRecord,
    content,
    versionCreatedAt: version.created_at,
    exportMetadata: parseExportMetadata(
      (letter.recipient_snapshot as Record<string, unknown> | null) ?? null,
    ),
    versions: (versions ?? []).map((entry) => ({
      id: entry.id,
      version_number: entry.version_number,
      change_reason: entry.change_reason,
      created_at: entry.created_at,
    })),
  };
}
