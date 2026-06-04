import type {
  LiveCallMessageRecord,
  LiveCallMinaGuidanceContent,
  LiveCallUserMessageContent,
} from "@/types/live-call";

export interface BuiltLiveCallSummary {
  what_happened: string;
  important_points: string[];
  risks: string[];
  recommended_actions: string[];
  next_step: string;
}

function isMinaGuidance(
  content: LiveCallUserMessageContent | LiveCallMinaGuidanceContent,
): content is LiveCallMinaGuidanceContent {
  return "suggested_response" in content;
}

export function buildLiveCallSummary(
  messages: LiveCallMessageRecord[],
): BuiltLiveCallSummary {
  const userInputs = messages.filter((message) => message.role === "user");
  const minaResponses = messages.filter((message) => message.role === "mina");

  const whatParts = userInputs.map((message, index) => {
    const content = message.content as LiveCallUserMessageContent;
    const notes = content.notes ? ` (Your note: ${content.notes})` : "";
    return `Turn ${index + 1}: Caller/collector said "${content.text}"${notes}`;
  });

  const importantPoints = new Set<string>();
  const risks = new Set<string>();
  const recommendedActions = new Set<string>();

  for (const message of minaResponses) {
    if (!isMinaGuidance(message.content)) {
      continue;
    }

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

  const lastMina = minaResponses.at(-1)?.content;

  return {
    what_happened:
      whatParts.length > 0
        ? whatParts.join("\n")
        : "You started a live call coaching session but no inputs were recorded.",
    important_points: Array.from(importantPoints).slice(0, 6),
    risks: Array.from(risks).slice(0, 5),
    recommended_actions: Array.from(recommendedActions).slice(0, 4),
    next_step:
      lastMina && isMinaGuidance(lastMina)
        ? "Review your notes, keep any written follow-up the caller promised, and decide your next step when you feel ready."
        : "Save your notes and review the conversation when you have a quiet moment.",
  };
}
