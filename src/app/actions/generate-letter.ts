"use server";

import { z } from "zod";

import { buildLetterGenerationSourceData } from "@/lib/letters/build-source-data";
import {
  generateLetterContent,
  serializeLetterVersionContent,
} from "@/lib/letters/generate-letter-content";
import { createClient } from "@/lib/supabase/server";
import { LETTER_TYPES, type GenerateLetterResult, type LetterType } from "@/types/letters";

const generateLetterSchema = z.object({
  letterType: z.enum(LETTER_TYPES),
  documentId: z.string().uuid().optional(),
  collectorId: z.string().uuid().optional(),
  debtSituationId: z.string().uuid().optional(),
});

async function loadLatestExtractedFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

export async function generateLetter(input: {
  letterType: LetterType;
  documentId?: string;
  collectorId?: string;
  debtSituationId?: string;
}): Promise<GenerateLetterResult> {
  const parsed = generateLetterSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid letter request.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, state")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { status: "error", message: profileError.message };
  }

  if (!profile) {
    return { status: "error", message: "Profile not found." };
  }

  let document:
    | {
        id: string;
        confirmed_data: Record<string, unknown> | null;
        collector_id: string | null;
        debt_situation_id: string | null;
        original_filename: string;
      }
    | null = null;
  let documentSummary: string | null = null;

  if (parsed.data.documentId) {
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, confirmed_data, collector_id, debt_situation_id, original_filename",
      )
      .eq("id", parsed.data.documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return { status: "error", message: error.message };
    }

    if (!data) {
      return { status: "error", message: "Selected document was not found." };
    }

    document = data;

    const { data: latestRun } = await supabase
      .from("document_analysis_runs")
      .select("plain_language_summary")
      .eq("document_id", data.id)
      .eq("status", "completed")
      .order("run_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    documentSummary = latestRun?.plain_language_summary ?? null;
  }

  const collectorId = parsed.data.collectorId ?? document?.collector_id ?? null;
  const debtSituationId =
    parsed.data.debtSituationId ?? document?.debt_situation_id ?? null;

  let collector: { name: string; address: string | null } | null = null;

  if (collectorId) {
    const { data, error } = await supabase
      .from("collectors")
      .select("name, address")
      .eq("id", collectorId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return { status: "error", message: error.message };
    }

    collector = data;
  }

  let creditorName: string | null = null;
  let debtCategory: string | null = null;

  if (debtSituationId) {
    const { data: debtSituation, error: debtError } = await supabase
      .from("debt_situations")
      .select("category, label, creditor_id")
      .eq("id", debtSituationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (debtError) {
      return { status: "error", message: debtError.message };
    }

    debtCategory = debtSituation?.label ?? debtSituation?.category ?? null;

    if (debtSituation?.creditor_id) {
      const { data: creditor, error: creditorError } = await supabase
        .from("creditors")
        .select("name")
        .eq("id", debtSituation.creditor_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (creditorError) {
        return { status: "error", message: creditorError.message };
      }

      creditorName = creditor?.name ?? null;
    }
  }

  const extractedFields = document
    ? await loadLatestExtractedFields(supabase, document.id)
    : [];

  const sourceData = buildLetterGenerationSourceData({
    collectorName: collector?.name ?? null,
    collectorAddress: collector?.address ?? null,
    creditorName,
    debtCategory,
    confirmedData: document?.confirmed_data ?? null,
    extractedFields,
    documentSummary,
  });

  const { data: template, error: templateError } = await supabase
    .from("letter_templates")
    .select("id, letter_type, name, jurisdiction_scope, template_body, is_active, version")
    .eq("letter_type", parsed.data.letterType)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (templateError) {
    return { status: "error", message: templateError.message };
  }

  const generatedAt = new Date().toISOString();
  const content = generateLetterContent({
    letterType: parsed.data.letterType,
    template: template ?? null,
    generatedAt,
    profile: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      state: profile.state,
    },
    sourceData,
  });

  const recipientSnapshot = {
    name: sourceData.recipientName,
    address: sourceData.recipientAddress,
    collector_id: collectorId,
  };

  const { data: letter, error: letterError } = await supabase
    .from("letters")
    .insert({
      user_id: user.id,
      letter_type: parsed.data.letterType,
      status: "draft",
      document_id: document?.id ?? null,
      debt_situation_id: debtSituationId,
      collector_id: collectorId,
      letter_template_id: template?.id ?? null,
      recipient_snapshot: recipientSnapshot,
      current_version: 1,
    })
    .select("id")
    .single();

  if (letterError || !letter) {
    return {
      status: "error",
      message: letterError?.message ?? "Failed to create letter.",
    };
  }

  const { error: versionError } = await supabase.from("letter_versions").insert({
    letter_id: letter.id,
    version_number: 1,
    content: serializeLetterVersionContent(content),
    change_reason: "generated",
  });

  if (versionError) {
    return { status: "error", message: versionError.message };
  }

  return {
    status: "success",
    letterId: letter.id,
  };
}
