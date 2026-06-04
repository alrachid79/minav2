import "server-only";

import { serializeLetterVersionContent } from "@/lib/letters/generate-letter-content";
import type { LetterVersionContent } from "@/types/letters";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LetterVersionChangeReason = "generated" | "edited" | "revised" | "finalized";

export async function appendLetterVersion(input: {
  supabase: SupabaseClient;
  userId: string;
  letterId: string;
  content: LetterVersionContent;
  changeReason: LetterVersionChangeReason;
}): Promise<{ versionNumber: number }> {
  const { data: letter, error: letterError } = await input.supabase
    .from("letters")
    .select("id, current_version")
    .eq("id", input.letterId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (letterError) {
    throw new Error(letterError.message);
  }

  if (!letter) {
    throw new Error("Letter not found.");
  }

  const nextVersion = letter.current_version + 1;

  const { error: versionError } = await input.supabase.from("letter_versions").insert({
    letter_id: input.letterId,
    version_number: nextVersion,
    content: serializeLetterVersionContent(input.content),
    change_reason: input.changeReason,
  });

  if (versionError) {
    throw new Error(versionError.message);
  }

  const { error: updateError } = await input.supabase
    .from("letters")
    .update({
      current_version: nextVersion,
      status: "draft",
    })
    .eq("id", input.letterId)
    .eq("user_id", input.userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { versionNumber: nextVersion };
}
