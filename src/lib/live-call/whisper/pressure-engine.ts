import type { ParsedCallInput } from "@/lib/live-call/whisper/parse-input";
import type { WhisperPressureLevel } from "@/lib/live-call/whisper/stages";

export function computePressure(input: ParsedCallInput): WhisperPressureLevel {
  if (
    input.legalThreat ||
    input.lawsuitMention ||
    input.garnishmentMention ||
    input.courtMention
  ) {
    return "High";
  }

  if (
    input.expiresToday ||
    input.paymentDemand ||
    input.deadline !== null ||
    input.noMonthlyPayments
  ) {
    return "Medium";
  }

  return "Low";
}
