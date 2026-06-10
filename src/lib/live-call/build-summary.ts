import {
  isLegacyGuidance,
  isWhisperGuidance,
} from "@/lib/live-call/generate-guidance";
import type {
  LiveCallMessageRecord,
  LiveCallUserMessageContent,
} from "@/types/live-call";

export interface BuiltLiveCallSummary {
  what_happened: string;
  important_points: string[];
  risks: string[];
  recommended_actions: string[];
  next_step: string;
}

export function buildLiveCallSummary(
  messages: LiveCallMessageRecord[],
): BuiltLiveCallSummary {
  const userInputs = messages.filter((message) => message.role === "user");
  const minaResponses = messages.filter((message) => message.role === "mina");

  const whatParts = userInputs.map((message, index) => {
    const content = message.content as LiveCallUserMessageContent;
    const notes = content.notes ? ` (Your note: ${content.notes})` : "";
    return `Turn ${index + 1}: Caller said "${content.text}"${notes}`;
  });

  const importantPoints = new Set<string>();
  const risks = new Set<string>();
  const recommendedActions = new Set<string>();

  for (const message of minaResponses) {
    if (isWhisperGuidance(message.content)) {
      message.content.captured.forEach((item) => importantPoints.add(item));

      if (message.content.pressure === "High") {
        risks.add(`${message.content.stage}: high pressure`);
      }

      if (
        message.content.stage_code === "LEGAL_THREAT" ||
        message.content.stage === "Legal Threat"
      ) {
        risks.add("Legal threat language was used during the call.");
      }

      if (message.content.missing.length > 0) {
        recommendedActions.add(
          `Request in writing: ${message.content.missing.slice(0, 3).join(", ")}`,
        );
      }

      if (message.content.reality_check) {
        importantPoints.add(message.content.reality_check.verdict);
      }

      continue;
    }

    if (isLegacyGuidance(message.content)) {
      importantPoints.add(message.content.what_is_happening);

      if (message.content.pressure_tactic) {
        risks.add(message.content.pressure_tactic);
      }

      if (message.content.risk_level === "legal_attention") {
        risks.add("Legal-sounding language was detected during the call.");
      }

      recommendedActions.add(message.content.communication_guidance);
      message.content.things_to_understand.forEach((item) => importantPoints.add(item));
    }
  }

  const lastMina = minaResponses.at(-1)?.content;
  let nextStep =
    "Review your notes and any written follow-up before deciding your next step.";

  if (isWhisperGuidance(lastMina)) {
    nextStep = `Last stage: ${lastMina.stage}. Take time to review captured details and request anything still missing in writing.`;
  } else if (isLegacyGuidance(lastMina)) {
    nextStep =
      "Review your notes, keep any written follow-up the caller promised, and decide your next step when you feel ready.";
  }

  return {
    what_happened:
      whatParts.length > 0
        ? whatParts.join("\n")
        : "You started a Whisper Mode session but no inputs were recorded.",
    important_points: Array.from(importantPoints).slice(0, 8),
    risks: Array.from(risks).slice(0, 5),
    recommended_actions: Array.from(recommendedActions).slice(0, 4),
    next_step: nextStep,
  };
}
