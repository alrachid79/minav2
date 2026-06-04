import {
  LIVE_CALL_EDUCATIONAL_DISCLAIMER,
  LIVE_CALL_GUIDANCE_DISCLAIMER,
} from "@/lib/live-call/constants";
import {
  detectCallPressure,
  normalizeCallInput,
} from "@/lib/live-call/detect-pressure";
import type { LiveCallMinaGuidanceContent } from "@/types/live-call";

export interface GenerateLiveCallGuidanceInput {
  collectorSaid: string;
  userNotes: string | null;
  turnNumber: number;
}

function buildWhatIsHappening(detection: ReturnType<typeof detectCallPressure>): string {
  if (detection.legalLanguage) {
    return "The caller used language that may involve legal or court-related topics. That can feel intense — slowing down is reasonable.";
  }

  if (detection.settlementLanguage) {
    return "The caller appears to be discussing payment terms or an offer. It helps to listen for specifics before deciding anything.";
  }

  if (detection.tactic) {
    return "The caller’s wording may be designed to create urgency. You can still ask questions and pause before responding.";
  }

  if (detection.paymentDemand) {
    return "The caller is discussing payment. You can ask for details in writing and take time to review them.";
  }

  return "You’re gathering information from a live conversation. It’s okay to move at a pace that feels manageable.";
}

function buildSuggestedResponse(input: {
  detection: ReturnType<typeof detectCallPressure>;
  turnNumber: number;
}): string {
  const { detection, turnNumber } = input;

  if (detection.legalLanguage) {
    return "I want to understand what this is about. Can you send the details in writing, including the account reference and your company information?";
  }

  if (detection.settlementLanguage) {
    return "I hear that you’re discussing payment options. I’d like any offer and account details sent to me in writing before I respond further.";
  }

  if (detection.validationLanguage) {
    return "I’d like more information about this account in writing before we continue. Please include what the balance is based on and who the original creditor is.";
  }

  if (detection.urgencyLanguage || detection.tactic) {
    return "I understand this is time-sensitive. I’m not ready to commit on the phone — please send the details in writing so I can review them carefully.";
  }

  if (turnNumber <= 1) {
    return "Thank you for calling. Can you tell me your name, company, and the reason for the call? I’d also like the account reference in writing.";
  }

  return "I’m taking notes. Can you repeat the key details and confirm you can send them to me in writing after this call?";
}

function buildClarifyingQuestions(detection: ReturnType<typeof detectCallPressure>): string[] {
  const questions = [
    "Who are you representing, and how can I verify your company?",
    "What account reference or file number is this about?",
    "Can you send a written summary of what you’re stating on this call?",
  ];

  if (detection.legalLanguage) {
    questions.unshift("Are you stating this is a legal matter, and what document supports that?");
  }

  if (detection.settlementLanguage) {
    questions.unshift("What exact terms are being proposed, and what is the deadline if any?");
  }

  return questions.slice(0, 4);
}

function buildThingsToUnderstand(detection: ReturnType<typeof detectCallPressure>): string[] {
  const items = [
    "You do not have to decide anything during the call.",
    "You can ask for information in writing before responding.",
    "Taking notes helps you review the conversation later without pressure.",
  ];

  if (detection.legalLanguage) {
    items.unshift(
      "Legal-sounding language can be stressful — consider reviewing written details before acting.",
    );
  }

  if (detection.settlementLanguage) {
    items.unshift(
      "Payment or offer language deserves careful review — compare any numbers to your own records.",
    );
  }

  return items.slice(0, 4);
}

function buildCommunicationGuidance(detection: ReturnType<typeof detectCallPressure>): string {
  if (detection.riskLevel === "legal_attention") {
    return "Keep responses brief and factual. Avoid admitting the debt, agreeing to pay, or discussing settlement terms on the call. Request written documentation and end the call if you need time.";
  }

  if (detection.tactic || detection.urgencyLanguage) {
    return "Use calm, neutral language. It’s appropriate to pause, repeat back what you heard, and ask for written follow-up rather than responding under pressure.";
  }

  return "Speak slowly, ask one question at a time, and confirm you’ll review anything important in writing before deciding next steps.";
}

export function generateLiveCallGuidance(
  input: GenerateLiveCallGuidanceInput,
): LiveCallMinaGuidanceContent {
  const combined = [input.collectorSaid, input.userNotes ?? ""].join(" ");
  const normalized = normalizeCallInput(combined);
  const detection = detectCallPressure(normalized);

  return {
    suggested_response: buildSuggestedResponse({
      detection,
      turnNumber: input.turnNumber,
    }),
    clarifying_questions: buildClarifyingQuestions(detection),
    things_to_understand: buildThingsToUnderstand(detection),
    communication_guidance: buildCommunicationGuidance(detection),
    what_is_happening: buildWhatIsHappening(detection),
    pressure_tactic: detection.tactic,
    risk_level: detection.riskLevel,
    disclaimer: `${LIVE_CALL_GUIDANCE_DISCLAIMER} ${LIVE_CALL_EDUCATIONAL_DISCLAIMER}`,
  };
}
