import "server-only";

import {
  serializeLetterVersionContent,
  type GenerateLetterContentInput,
  generateLetterContent,
} from "@/lib/letters/generate-letter-content";
import { buildLetterGenerationSourceData } from "@/lib/letters/build-source-data";
import type { LetterType, LetterVersionContent } from "@/types/letters";
import type { SupabaseClient } from "@supabase/supabase-js";

async function loadLatestExtractedFields(
  supabase: SupabaseClient,
  documentId: string,
) {
  const { data: run, error: runError } = await supabase
    .from("document_analysis_runs")
    .select("id")
    .eq("document_id", documentId)
    .eq("status", "completed")
    .order("run_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runError) {
    throw new Error(runError.message);
  }

  if (!run) {
    return [];
  }

  const { data, error } = await supabase
    .from("document_extracted_fields")
    .select("field_key, field_value, confidence_score")
    .eq("document_analysis_run_id", run.id);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function buildRegeneratedLetterContent(input: {
  supabase: SupabaseClient;
  userId: string;
  letter: {
    letter_type: LetterType;
    document_id: string | null;
    collector_id: string | null;
    debt_situation_id: string | null;
    letter_template_id: string | null;
    recipient_snapshot: Record<string, unknown> | null;
  };
  generatedAt: string;
}): Promise<LetterVersionContent> {
  const { data: profile, error: profileError } = await input.supabase
    .from("profiles")
    .select("first_name, last_name, email, state")
    .eq("id", input.userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    throw new Error("Profile not found.");
  }

  let document:
    | {
        id: string;
        confirmed_data: Record<string, unknown> | null;
      }
    | null = null;
  let documentSummary: string | null = null;

  if (input.letter.document_id) {
    const { data, error } = await input.supabase
      .from("documents")
      .select("id, confirmed_data")
      .eq("id", input.letter.document_id)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    document = data;

    if (data) {
      const { data: latestRun } = await input.supabase
        .from("document_analysis_runs")
        .select("plain_language_summary")
        .eq("document_id", data.id)
        .eq("status", "completed")
        .order("run_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      documentSummary = latestRun?.plain_language_summary ?? null;
    }
  }

  let collector: { name: string; address: string | null } | null = null;

  if (input.letter.collector_id) {
    const { data, error } = await input.supabase
      .from("collectors")
      .select("name, address")
      .eq("id", input.letter.collector_id)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    collector = data;
  }

  let creditorName: string | null = null;
  let debtCategory: string | null = null;

  if (input.letter.debt_situation_id) {
    const { data: debtSituation, error: debtError } = await input.supabase
      .from("debt_situations")
      .select("category, label, creditor_id")
      .eq("id", input.letter.debt_situation_id)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (debtError) {
      throw new Error(debtError.message);
    }

    debtCategory = debtSituation?.label ?? debtSituation?.category ?? null;

    if (debtSituation?.creditor_id) {
      const { data: creditor, error: creditorError } = await input.supabase
        .from("creditors")
        .select("name")
        .eq("id", debtSituation.creditor_id)
        .eq("user_id", input.userId)
        .maybeSingle();

      if (creditorError) {
        throw new Error(creditorError.message);
      }

      creditorName = creditor?.name ?? null;
    }
  }

  const snapshot = input.letter.recipient_snapshot ?? {};
  const snapshotName = typeof snapshot.name === "string" ? snapshot.name : null;
  const snapshotAddress =
    typeof snapshot.address === "string" ? snapshot.address : null;

  const extractedFields = document
    ? await loadLatestExtractedFields(input.supabase, document.id)
    : [];

  const sourceData = buildLetterGenerationSourceData({
    collectorName: collector?.name ?? snapshotName,
    collectorAddress: collector?.address ?? snapshotAddress,
    creditorName,
    debtCategory,
    confirmedData: document?.confirmed_data ?? null,
    extractedFields,
    documentSummary,
  });

  let template: GenerateLetterContentInput["template"] = null;

  if (input.letter.letter_template_id) {
    const { data, error } = await input.supabase
      .from("letter_templates")
      .select("id, letter_type, name, jurisdiction_scope, template_body, is_active, version")
      .eq("id", input.letter.letter_template_id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    template = data;
  }

  if (!template) {
    const { data, error } = await input.supabase
      .from("letter_templates")
      .select("id, letter_type, name, jurisdiction_scope, template_body, is_active, version")
      .eq("letter_type", input.letter.letter_type)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    template = data;
  }

  return generateLetterContent({
    letterType: input.letter.letter_type,
    template,
    generatedAt: input.generatedAt,
    profile: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      state: profile.state,
    },
    sourceData,
  });
}

export function buildEditedLetterContent(input: {
  current: LetterVersionContent;
  edits: {
    subject: string;
    greeting: string;
    body: string;
    closing: string;
  };
  editedAt: string;
}): LetterVersionContent {
  return {
    ...input.current,
    subject: input.edits.subject.trim(),
    greeting: input.edits.greeting.trim(),
    body: input.edits.body.trim(),
    closing: input.edits.closing.trim(),
    generated_at: input.editedAt,
  };
}

export { serializeLetterVersionContent };
