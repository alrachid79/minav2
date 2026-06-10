import { isWhisperGuidance } from "@/lib/live-call/generate-guidance";
import type { LiveCallMessageRecord, LiveCallMinaGuidanceContent } from "@/types/live-call";

const OBJECTIVE_LABELS: Record<string, string> = {
  amount: "Settlement amount",
  deadline: "Deadline",
  "account reference": "Account number",
  "written terms": "Written terms",
  "payment options": "Payment options",
  "company name": "Collector identified",
  "callback number": "Callback number",
  "original creditor": "Creditor identified",
  "written account details": "Account details",
  "written balance statement": "Balance verified",
  "fee breakdown": "Fee breakdown",
  "written payment plan terms": "Payment plan terms",
  "total cost": "Total cost",
  "due dates": "Due dates",
  "written legal documentation": "Legal documentation",
  "company verification": "Company verification",
  "written summary": "Written summary",
  "follow-up timeline": "Follow-up timeline",
};

function normalizeObjectiveKey(item: string): string {
  return item.toLowerCase().replace(/^missing:\s*/i, "").trim();
}

export function formatObjectiveLabel(item: string): string {
  const key = normalizeObjectiveKey(item);
  return OBJECTIVE_LABELS[key] ?? item.charAt(0).toUpperCase() + item.slice(1);
}

function formatCapturedLabel(item: string): string {
  const lower = item.toLowerCase();

  if (lower.includes("caller") || lower.includes("collector")) {
    return "Collector identified";
  }

  if (lower.includes("creditor")) {
    return "Creditor identified";
  }

  if (lower.includes("balance")) {
    return "Balance captured";
  }

  if (lower.includes("offer")) {
    return "Settlement offer captured";
  }

  if (lower.includes("deadline")) {
    return "Deadline captured";
  }

  if (lower.includes("legal")) {
    return "Legal language noted";
  }

  if (lower.includes("pressure")) {
    return "Pressure noted";
  }

  if (lower.includes("monthly")) {
    return "Payment terms discussed";
  }

  return item.charAt(0).toUpperCase() + item.slice(1);
}

export function aggregateCapturedProgress(messages: LiveCallMessageRecord[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const message of messages) {
    if (message.role !== "mina" || !isWhisperGuidance(message.content)) {
      continue;
    }

    for (const item of message.content.captured) {
      const label = formatCapturedLabel(item);
      const key = label.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        labels.push(label);
      }
    }
  }

  return labels;
}

export function extractOfferAmount(guidance: LiveCallMinaGuidanceContent): string | null {
  for (const item of guidance.captured) {
    const match = item.match(/offer\s+(\$[\d,]+(?:\.\d{2})?)/i);
    if (match) {
      return match[1];
    }
  }

  if (guidance.reality_check?.offer_amount) {
    return guidance.reality_check.offer_amount;
  }

  if (guidance.reality_check?.monthly_amount) {
    return guidance.reality_check.monthly_amount;
  }

  return null;
}

export function extractBalanceAmount(guidance: LiveCallMinaGuidanceContent): string | null {
  for (const item of guidance.captured) {
    const match = item.match(/balance\s+(\$[\d,]+(?:\.\d{2})?)/i);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function buildRealityCheckVerdict(
  pressure: LiveCallMinaGuidanceContent["pressure"],
): string {
  switch (pressure) {
    case "High":
      return "May create financial pressure";
    case "Medium":
      return "Needs review against your budget";
    default:
      return "May be manageable — verify details";
  }
}
