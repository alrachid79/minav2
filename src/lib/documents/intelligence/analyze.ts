import "server-only";

import { classifyDocument } from "@/lib/documents/intelligence/classify";
import { buildAnalysisCards } from "@/lib/documents/intelligence/build-cards";
import { extractEntities } from "@/lib/documents/intelligence/extract-entities";
import { detectLegalAttention } from "@/lib/documents/intelligence/legal-attention";
import { normalizeDocumentText } from "@/lib/documents/intelligence/normalize";
import type { DocumentIntelligenceResult } from "@/lib/documents/intelligence/types";

export function analyzeDocumentIntelligence(
  rawText: string,
): DocumentIntelligenceResult {
  const normalizedText = normalizeDocumentText(rawText);
  const classification = classifyDocument(normalizedText);
  const entities = extractEntities(rawText);
  const legalAttention = detectLegalAttention(normalizedText);
  const cards = buildAnalysisCards({ classification, entities, legalAttention });
  const recommendedActions = [
    cards.recommendedNextStep,
    ...cards.supportingActions,
  ];

  return {
    classification,
    entities,
    legalAttention,
    cards,
    plainLanguageSummary: cards.documentSummary,
    whatMinaSees: cards.whatMinaNoticed.join("\n"),
    recommendedActions,
    riskLevel: legalAttention.legalAttentionRequired
      ? "legal_attention_required"
      : "low",
  };
}
