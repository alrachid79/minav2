import { generateWhisperGuidance } from "@/lib/live-call/whisper/guidance-engine";
import type { WhisperFinancialProfile } from "@/lib/live-call/whisper/financial-profile";
import type { LiveCallMinaGuidanceContent, WhisperRealityCheckPayload } from "@/types/live-call";

export interface GenerateLiveCallGuidanceInput {
  collectorSaid: string;
  userNotes: string | null;
  turnNumber: number;
  priorTracker?: import("@/lib/live-call/whisper/information-tracker").WhisperInformationTracker | null;
  financialProfile?: WhisperFinancialProfile | null;
}

export function generateLiveCallGuidance(
  input: GenerateLiveCallGuidanceInput,
): LiveCallMinaGuidanceContent {
  return generateWhisperGuidance({
    collectorSaid: input.collectorSaid,
    userNotes: input.userNotes,
    turnNumber: input.turnNumber,
    priorTracker: input.priorTracker ?? null,
    financialProfile: input.financialProfile ?? null,
  });
}

export function isWhisperGuidance(
  content: unknown,
): content is LiveCallMinaGuidanceContent {
  return (
    typeof content === "object" &&
    content !== null &&
    "format" in content &&
    ((content as LiveCallMinaGuidanceContent).format === "whisper_v1" ||
      (content as LiveCallMinaGuidanceContent).format === "whisper_v2")
  );
}

export function isLegacyGuidance(content: unknown): content is {
  suggested_response: string;
  risk_level: string;
  what_is_happening: string;
  pressure_tactic: string | null;
  communication_guidance: string;
  things_to_understand: string[];
} {
  return (
    typeof content === "object" &&
    content !== null &&
    "suggested_response" in content
  );
}
