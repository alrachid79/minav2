import type {
  LiveCallMinaGuidanceContent,
  LiveCallUserMessageContent,
} from "@/types/live-call";

export function parseMessageContent(
  raw: unknown,
): LiveCallUserMessageContent | LiveCallMinaGuidanceContent {
  return raw as LiveCallUserMessageContent | LiveCallMinaGuidanceContent;
}
