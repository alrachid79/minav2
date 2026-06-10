import { parseConfirmedData } from "@/lib/documents/integration/metadata";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/intelligence/classify";
import type { DocumentType } from "@/lib/documents/intelligence/types";
import { isWhisperGuidance } from "@/lib/live-call/generate-guidance";
import type {
  LiveCallMessageRecord,
  WhisperRealityCheckPayload,
} from "@/types/live-call";
import type { SituationFinancialSignals, SituationPressureLevel } from "@/types/situations";

function readConfirmField(
  field: { value: string; unknown: boolean } | undefined,
): string | null {
  if (!field || field.unknown || !field.value.trim()) {
    return null;
  }

  return field.value.trim();
}

function maxPressure(
  current: SituationPressureLevel,
  next: SituationPressureLevel,
): SituationPressureLevel {
  const rank = { Low: 0, Medium: 1, High: 2 };
  return rank[next] > rank[current] ? next : current;
}

function timelineSummary(description: string | null): string | null {
  if (!description) {
    return null;
  }

  const lines = description.split("\n");
  const summary = lines.find((line) => !line.startsWith("mina_event_type:"));

  return summary?.trim() ?? description.trim();
}

interface DocumentRow {
  document_type: string;
  confirmed_at: string | null;
  confirmed_data: Record<string, unknown> | null;
  created_at: string;
}

interface TimelineRow {
  title: string;
  description: string | null;
  occurred_at: string;
  event_category: string;
  severity: string | null;
  is_legal_attention: boolean;
}

interface LegalAttentionRow {
  severity: string;
}

export function extractSignalsFromDocuments(
  documents: DocumentRow[],
): Partial<SituationFinancialSignals> & { pressure: SituationPressureLevel } {
  let balance: string | null = null;
  let latestOffer: string | null = null;
  let deadline: string | null = null;
  let pressure: SituationPressureLevel = "Low";

  const sorted = [...documents].sort((left, right) => {
    const leftAt = left.confirmed_at ?? left.created_at;
    const rightAt = right.confirmed_at ?? right.created_at;
    return rightAt.localeCompare(leftAt);
  });

  for (const document of sorted) {
    const confirmed = parseConfirmedData(document.confirmed_data);
    if (!confirmed) {
      continue;
    }

    const documentBalance = readConfirmField(confirmed.balance_amount);
    const documentDeadline = readConfirmField(confirmed.response_deadline);

    if (!balance && documentBalance) {
      balance = documentBalance;
    }

    if (!deadline && documentDeadline) {
      deadline = documentDeadline;
    }

    if (confirmed.document_type === "settlement_offer" && documentBalance) {
      latestOffer = documentBalance;
    }

    if (confirmed.legal_attention_required) {
      pressure = maxPressure(pressure, "High");
    }
  }

  return { balance, latestOffer, deadline, paymentTerms: null, realityCheck: null, pressure };
}

export function extractSignalsFromCallMessages(
  messages: LiveCallMessageRecord[],
): Partial<SituationFinancialSignals> & { pressure: SituationPressureLevel } {
  let balance: string | null = null;
  let latestOffer: string | null = null;
  let deadline: string | null = null;
  let paymentTerms: string | null = null;
  let realityCheck: WhisperRealityCheckPayload | null = null;
  let pressure: SituationPressureLevel = "Low";

  for (const message of messages) {
    if (message.role !== "mina" || !isWhisperGuidance(message.content)) {
      continue;
    }

    const tracker = message.content.tracker;

    if (tracker?.balance) {
      balance = tracker.balance;
    }

    if (tracker?.settlement_offer) {
      latestOffer = tracker.settlement_offer;
    }

    if (tracker?.deadline) {
      deadline = tracker.deadline;
    }

    if (tracker?.monthly_payment_offer) {
      paymentTerms = `${tracker.monthly_payment_offer} per month`;
    }

    if (message.content.reality_check) {
      realityCheck = message.content.reality_check;
    }

    pressure = maxPressure(pressure, message.content.pressure);
  }

  return { balance, latestOffer, deadline, paymentTerms, realityCheck, pressure };
}

export function extractSignalsFromTimeline(
  events: TimelineRow[],
): Partial<SituationFinancialSignals> & { pressure: SituationPressureLevel } {
  let latestOffer: string | null = null;
  let deadline: string | null = null;
  let pressure: SituationPressureLevel = "Low";

  const sorted = [...events].sort((left, right) =>
    right.occurred_at.localeCompare(left.occurred_at),
  );

  for (const event of sorted) {
    const summary = timelineSummary(event.description);
    const haystack = `${event.title} ${summary ?? ""}`.toLowerCase();

    if (!latestOffer && haystack.includes("settlement")) {
      const amountMatch = haystack.match(/\$[\d,]+(?:\.\d{2})?/);
      if (amountMatch) {
        latestOffer = amountMatch[0].toUpperCase().replace(/\$/g, "$");
      }
    }

    if (!deadline && event.event_category === "upcoming_deadline") {
      deadline = event.title.replace(/^Deadline:\s*/i, "").trim() || event.title;
    }

    if (event.is_legal_attention) {
      pressure = maxPressure(pressure, "High");
    } else if (event.severity === "attention") {
      pressure = maxPressure(pressure, "Medium");
    }
  }

  return { latestOffer, deadline, pressure };
}

export function extractSignalsFromLegalAttention(
  events: LegalAttentionRow[],
): SituationPressureLevel {
  if (events.length === 0) {
    return "Low";
  }

  const hasHigh = events.some((event) => event.severity === "high" || event.severity === "critical");
  if (hasHigh) {
    return "High";
  }

  return "Medium";
}

export function mergeSituationSignals(
  parts: Array<Partial<SituationFinancialSignals> & { pressure?: SituationPressureLevel }>,
): SituationFinancialSignals {
  let balance: string | null = null;
  let latestOffer: string | null = null;
  let deadline: string | null = null;
  let paymentTerms: string | null = null;
  let realityCheck: WhisperRealityCheckPayload | null = null;
  let pressure: SituationPressureLevel = "Low";

  for (const part of parts) {
    balance = balance ?? part.balance ?? null;
    latestOffer = latestOffer ?? part.latestOffer ?? null;
    deadline = deadline ?? part.deadline ?? null;
    paymentTerms = paymentTerms ?? part.paymentTerms ?? null;
    realityCheck = realityCheck ?? part.realityCheck ?? null;

    if (part.pressure) {
      pressure = maxPressure(pressure, part.pressure);
    }
  }

  return { balance, latestOffer, deadline, paymentTerms, realityCheck, pressure };
}

export function documentTypeLabel(documentType: string): string {
  return DOCUMENT_TYPE_LABELS[documentType as DocumentType] ?? "Document";
}
