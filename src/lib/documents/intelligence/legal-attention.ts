import type {
  LegalAttentionIndicator,
  LegalAttentionIssueType,
  LegalAttentionResult,
} from "@/lib/documents/intelligence/types";

const LEGAL_RULES: Array<{
  issueType: LegalAttentionIssueType;
  phrases: string[];
  confidence: number;
}> = [
  {
    issueType: "lawsuit",
    phrases: ["lawsuit", "civil action", "complaint filed", "legal action"],
    confidence: 0.85,
  },
  {
    issueType: "summons",
    phrases: [
      "summons",
      "you are hereby summoned",
      "served with",
      "service of process",
    ],
    confidence: 0.9,
  },
  {
    issueType: "court_date",
    phrases: [
      "court date",
      "hearing date",
      "trial date",
      "appear in court",
      "appearance required",
      "must appear",
    ],
    confidence: 0.88,
  },
  {
    issueType: "garnishment",
    phrases: [
      "garnishment",
      "wage garnishment",
      "bank levy",
      "levy on",
      "attachment of wages",
    ],
    confidence: 0.9,
  },
  {
    issueType: "judgment",
    phrases: [
      "judgment entered",
      "default judgment",
      "judgment against you",
      "judgment has been entered",
    ],
    confidence: 0.87,
  },
  {
    issueType: "irs_enforcement",
    phrases: [
      "intent to levy",
      "notice of levy",
      "federal tax lien",
      "seize your property",
      "final notice",
      "tax levy",
    ],
    confidence: 0.88,
  },
];

export function detectLegalAttention(
  normalizedText: string,
): LegalAttentionResult {
  const indicators: LegalAttentionIndicator[] = [];

  for (const rule of LEGAL_RULES) {
    for (const phrase of rule.phrases) {
      if (normalizedText.includes(phrase)) {
        indicators.push({
          issueType: rule.issueType,
          matchedPhrase: phrase,
          confidence: rule.confidence,
        });
        break;
      }
    }
  }

  return {
    legalAttentionRequired: indicators.length > 0,
    indicators,
  };
}
