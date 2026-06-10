import {
  createEmptyTracker,
  listCapturedTrackerFields,
  listMissingTrackerFields,
  type WhisperInformationTracker,
} from "@/lib/live-call/whisper/information-tracker";
import type { WhisperFinancialProfile } from "@/lib/live-call/whisper/financial-profile";
import { emptyProfile } from "@/lib/live-call/whisper/financial-profile";
import { parseCallInput } from "@/lib/live-call/whisper/parse-input";
import { computePressure } from "@/lib/live-call/whisper/pressure-engine";
import { assessOfferAffordability } from "@/lib/live-call/whisper/reality-check";
import {
  buildStageResponse,
  markResponseAsked,
} from "@/lib/live-call/whisper/response-engine";
import {
  detectIntelligenceStage,
  updateTrackerFromInput,
} from "@/lib/live-call/whisper/stage-engine";
import { STAGE_LABELS } from "@/lib/live-call/whisper/stages";
import type { LiveCallMinaGuidanceContent, WhisperRealityCheckPayload } from "@/types/live-call";

export interface GenerateWhisperGuidanceInput {
  collectorSaid: string;
  userNotes: string | null;
  turnNumber: number;
  priorTracker: WhisperInformationTracker | null;
  financialProfile?: WhisperFinancialProfile | null;
}

export function extractTrackerFromGuidance(
  content: unknown,
): WhisperInformationTracker | null {
  if (
    typeof content === "object" &&
    content !== null &&
    "format" in content &&
    (content as LiveCallMinaGuidanceContent).format === "whisper_v2" &&
    "tracker" in content
  ) {
    return (content as LiveCallMinaGuidanceContent).tracker ?? null;
  }

  return null;
}

export function generateWhisperGuidance(input: GenerateWhisperGuidanceInput): LiveCallMinaGuidanceContent {
  const combined = [input.collectorSaid, input.userNotes ?? ""].join(" ");
  const parsed = parseCallInput(combined);
  const baseTracker = input.priorTracker ?? createEmptyTracker();
  const profile = input.financialProfile ?? emptyProfile();

  const stage = detectIntelligenceStage({
    parsed,
    turnNumber: input.turnNumber,
    tracker: baseTracker,
  });

  let tracker = updateTrackerFromInput(baseTracker, parsed, stage);
  const pressure = computePressure(parsed);
  const affordability = assessOfferAffordability({ parsed, tracker, profile });

  let sayNow = buildStageResponse({ stage, parsed, tracker, affordability });
  tracker = markResponseAsked(tracker, sayNow);

  const captured = listCapturedTrackerFields(tracker);
  const missing = listMissingTrackerFields(tracker).map((field) => {
    const labels: Record<string, string> = {
      collector_name: "Collector name",
      creditor_name: "Creditor name",
      balance: "Balance",
      settlement_offer: "Settlement amount",
      monthly_payment_offer: "Monthly payment offer",
      deadline: "Deadline",
      account_reference: "Account number",
      written_offer_received: "Written terms",
    };
    return labels[field] ?? field;
  });

  const realityCheck: WhisperRealityCheckPayload | undefined = affordability.reality_check
    ? {
        verdict: affordability.reality_check.verdict,
        offer_amount: affordability.reality_check.offer_amount,
        monthly_amount: affordability.reality_check.monthly_amount,
        available_amount: affordability.reality_check.available_amount,
        available_label: affordability.reality_check.available_label,
        classification: affordability.reality_check.classification,
      }
    : undefined;

  return {
    format: "whisper_v2",
    stage: STAGE_LABELS[stage],
    stage_code: stage,
    say_now: sayNow,
    pressure,
    captured: captured.length > 0 ? captured : ["Listening…"],
    missing,
    tracker,
    ...(realityCheck ? { reality_check: realityCheck } : {}),
  };
}
