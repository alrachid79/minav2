import type { ClassificationResult, DocumentType } from "@/lib/documents/intelligence/types";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  collection_letter: "Collection Letter",
  settlement_offer: "Settlement Offer",
  medical_billing_notice: "Medical Bill Notice",
  irs_notice: "IRS Notice",
  court_lawsuit_notice: "Court / Lawsuit Notice",
  debt_validation_response: "Debt Validation Response",
  unknown: "Unknown",
};

const CLASSIFICATION_KEYWORDS: Record<
  Exclude<DocumentType, "unknown">,
  Array<{ phrase: string; weight: number }>
> = {
  collection_letter: [
    { phrase: "debt collector", weight: 4 },
    { phrase: "collection agency", weight: 4 },
    { phrase: "collection letter", weight: 3 },
    { phrase: "past due", weight: 2 },
    { phrase: "amount due", weight: 2 },
    { phrase: "pay immediately", weight: 2 },
    { phrase: "final notice", weight: 2 },
    { phrase: "attempt to collect", weight: 3 },
  ],
  settlement_offer: [
    { phrase: "settlement offer", weight: 5 },
    { phrase: "offer to settle", weight: 4 },
    { phrase: "settle for", weight: 4 },
    { phrase: "settlement amount", weight: 3 },
    { phrase: "lump sum", weight: 2 },
    { phrase: "resolve this account", weight: 2 },
  ],
  medical_billing_notice: [
    { phrase: "medical bill", weight: 4 },
    { phrase: "hospital", weight: 3 },
    { phrase: "patient account", weight: 3 },
    { phrase: "healthcare", weight: 2 },
    { phrase: "physician", weight: 2 },
    { phrase: "emergency room", weight: 2 },
    { phrase: "billing statement", weight: 3 },
  ],
  irs_notice: [
    { phrase: "internal revenue service", weight: 5 },
    { phrase: "department of the treasury", weight: 4 },
    { phrase: "notice of intent to levy", weight: 5 },
    { phrase: "form cp", weight: 3 },
    { phrase: "tax due", weight: 3 },
    { phrase: "irs", weight: 2 },
    { phrase: "federal tax", weight: 3 },
  ],
  court_lawsuit_notice: [
    { phrase: "summons", weight: 5 },
    { phrase: "civil action", weight: 4 },
    { phrase: "complaint", weight: 3 },
    { phrase: "lawsuit", weight: 4 },
    { phrase: "superior court", weight: 4 },
    { phrase: "district court", weight: 4 },
    { phrase: "plaintiff", weight: 3 },
    { phrase: "defendant", weight: 3 },
    { phrase: "you are hereby summoned", weight: 5 },
  ],
  debt_validation_response: [
    { phrase: "debt validation", weight: 5 },
    { phrase: "verification of debt", weight: 5 },
    { phrase: "validation request", weight: 4 },
    { phrase: "account verified", weight: 3 },
    { phrase: "validation response", weight: 4 },
  ],
};

const MIN_CLASSIFICATION_SCORE = 3;

export function classifyDocument(normalizedText: string): ClassificationResult {
  let bestType: DocumentType = "unknown";
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(CLASSIFICATION_KEYWORDS) as Array<
    [Exclude<DocumentType, "unknown">, Array<{ phrase: string; weight: number }>]
  >) {
    let score = 0;

    for (const { phrase, weight } of keywords) {
      if (normalizedText.includes(phrase)) {
        score += weight;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  if (bestScore < MIN_CLASSIFICATION_SCORE) {
    return {
      documentType: "unknown",
      confidence: 0.35,
      label: DOCUMENT_TYPE_LABELS.unknown,
    };
  }

  const confidence = Math.min(0.95, 0.45 + bestScore * 0.05);

  return {
    documentType: bestType,
    confidence,
    label: DOCUMENT_TYPE_LABELS[bestType],
  };
}
