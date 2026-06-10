import type { WhisperIntelligenceStage } from "@/lib/live-call/whisper/stages";

export interface WhisperInformationTracker {
  collector_name: string | null;
  creditor_name: string | null;
  balance: string | null;
  settlement_offer: string | null;
  monthly_payment_offer: string | null;
  deadline: string | null;
  account_reference: string | null;
  written_offer_received: boolean;
  current_stage: WhisperIntelligenceStage;
  monthly_payments_asked: boolean;
}

export const TRACKER_FIELD_LABELS: Record<
  keyof Omit<WhisperInformationTracker, "current_stage" | "monthly_payments_asked">,
  string
> = {
  collector_name: "Collector name",
  creditor_name: "Creditor name",
  balance: "Balance",
  settlement_offer: "Settlement offer",
  monthly_payment_offer: "Monthly payment offer",
  deadline: "Deadline",
  account_reference: "Account reference",
  written_offer_received: "Written offer",
};

export function createEmptyTracker(): WhisperInformationTracker {
  return {
    collector_name: null,
    creditor_name: null,
    balance: null,
    settlement_offer: null,
    monthly_payment_offer: null,
    deadline: null,
    account_reference: null,
    written_offer_received: false,
    current_stage: "IDENTITY_VERIFICATION",
    monthly_payments_asked: false,
  };
}

export function listMissingTrackerFields(tracker: WhisperInformationTracker): string[] {
  const missing: string[] = [];

  if (!tracker.collector_name) {
    missing.push("collector_name");
  }
  if (!tracker.account_reference && !tracker.balance) {
    missing.push("account_reference");
  }
  if (!tracker.balance) {
    missing.push("balance");
  }
  if (!tracker.settlement_offer) {
    missing.push("settlement_offer");
  }
  if (!tracker.monthly_payment_offer) {
    missing.push("monthly_payment_offer");
  }
  if (!tracker.deadline) {
    missing.push("deadline");
  }
  if (!tracker.written_offer_received) {
    missing.push("written_offer_received");
  }

  return missing;
}

export function listCapturedTrackerFields(tracker: WhisperInformationTracker): string[] {
  const captured: string[] = [];

  if (tracker.collector_name) {
    captured.push(`Collector: ${tracker.collector_name}`);
  }
  if (tracker.creditor_name) {
    captured.push(`Creditor: ${tracker.creditor_name}`);
  }
  if (tracker.balance) {
    captured.push(`Balance: ${tracker.balance}`);
  }
  if (tracker.settlement_offer) {
    captured.push(`Offer: ${tracker.settlement_offer}`);
  }
  if (tracker.monthly_payment_offer) {
    captured.push(`Monthly: ${tracker.monthly_payment_offer}`);
  }
  if (tracker.deadline) {
    captured.push(`Deadline: ${tracker.deadline}`);
  }
  if (tracker.account_reference) {
    captured.push(`Account: ${tracker.account_reference}`);
  }
  if (tracker.written_offer_received) {
    captured.push("Written offer received");
  }

  return captured;
}
