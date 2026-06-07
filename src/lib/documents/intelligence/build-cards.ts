import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/intelligence/classify";
import type {
  ClassificationResult,
  DocumentAnalysisCards,
  DocumentType,
  ExtractedEntities,
  LegalAttentionResult,
  RecommendedAction,
} from "@/lib/documents/intelligence/types";

function buildSummary(
  classification: ClassificationResult,
  entities: ExtractedEntities,
): string {
  const parts: string[] = [
    `This document appears to be a ${classification.label.toLowerCase()}.`,
  ];

  if (entities.balanceAmount) {
    parts.push(`It references an amount of ${entities.balanceAmount}.`);
  } else if (entities.accountReference) {
    parts.push(`It references account ${entities.accountReference}.`);
  } else {
    parts.push("Mina found limited structured details in the text.");
  }

  parts.push(
    "This summary reflects what the document states — not whether the debt or claim is valid.",
  );

  return parts.join(" ");
}

function buildWhatMinaNoticed(
  classification: ClassificationResult,
  entities: ExtractedEntities,
  legalAttention: LegalAttentionResult,
): string[] {
  const notices: string[] = [
    `Document type estimate: ${classification.label} (${Math.round(classification.confidence * 100)}% pattern match).`,
  ];

  if (entities.balanceAmount) {
    notices.push(`A dollar amount appears in the text: ${entities.balanceAmount}.`);
  }

  if (entities.responseDeadline) {
    notices.push(`A response deadline may be ${entities.responseDeadline}.`);
  }

  if (entities.courtDate) {
    notices.push(`A court or hearing date may be ${entities.courtDate}.`);
  }

  if (!entities.contactPhone && !entities.contactEmail) {
    notices.push("No clear phone number or email was detected.");
  }

  if (legalAttention.legalAttentionRequired) {
    notices.push(
      "Language in this document may relate to legal action or enforcement. This is a signal to review carefully — not legal advice.",
    );
  }

  if (classification.documentType === "unknown") {
    notices.push(
      "Mina could not confidently match this to a common document category.",
    );
  }

  return notices;
}

function recommendedActionsForType(
  documentType: DocumentType,
  legalAttention: LegalAttentionResult,
): RecommendedAction[] {
  if (legalAttention.legalAttentionRequired) {
    return [
      {
        priority: "primary",
        title: "Review dates and legal language carefully",
        description:
          "Write down any dates mentioned and consider speaking with a qualified professional in your state. Mina cannot interpret the law or predict outcomes.",
      },
      {
        priority: "secondary",
        title: "Keep a copy of this document",
        description:
          "Save the original file and note when you received it.",
      },
    ];
  }

  switch (documentType) {
    case "collection_letter":
      return [
        {
          priority: "primary",
          title: "Verify what the letter claims",
          description:
            "Compare the balance and account details to your records before responding or paying.",
        },
        {
          priority: "secondary",
          title: "Consider a debt validation request",
          description:
            "If details are unclear, you may want to request validation in writing before taking action.",
        },
      ];
    case "settlement_offer":
      return [
        {
          priority: "primary",
          title: "Review the settlement terms",
          description:
            "Check the offered amount, deadline, and whether the letter explains how the account would be reported.",
        },
        {
          priority: "secondary",
          title: "Get any agreement in writing",
          description:
            "Do not pay based on a phone call alone — keep written confirmation of terms.",
        },
      ];
    case "medical_billing_notice":
      return [
        {
          priority: "primary",
          title: "Check the bill against your records",
          description:
            "Compare charges with any insurance explanation of benefits or provider statements you have.",
        },
        {
          priority: "secondary",
          title: "Contact the billing office if something looks wrong",
          description:
            "Ask for an itemized statement if charges are unclear.",
        },
      ];
    case "irs_notice":
      return [
        {
          priority: "primary",
          title: "Note the notice number and deadline",
          description:
            "IRS notices often include response deadlines. Missing them can limit your options.",
        },
        {
          priority: "secondary",
          title: "Use official IRS channels to verify",
          description:
            "Confirm notice details through IRS.gov or a trusted tax professional.",
        },
      ];
    case "court_lawsuit_notice":
      return [
        {
          priority: "primary",
          title: "Record every date on this notice",
          description:
            "Court documents often include strict deadlines. Missing them can have serious consequences.",
        },
        {
          priority: "secondary",
          title: "Seek qualified help if you are unsure",
          description:
            "Consider speaking with a legal aid office or attorney in your state.",
        },
      ];
    case "debt_validation_response":
      return [
        {
          priority: "primary",
          title: "Compare the response to your records",
          description:
            "Check whether the account details match what you believe you owe.",
        },
        {
          priority: "secondary",
          title: "Decide your next response in writing",
          description:
            "If information is missing or wrong, plan a written follow-up.",
        },
      ];
    default:
      return [
        {
          priority: "primary",
          title: "Review key amounts and dates",
          description:
            "Write down any balances, reference numbers, and deadlines you see in the document.",
        },
        {
          priority: "secondary",
          title: "Keep this document organized",
          description:
            "Store it somewhere safe in case you need it for future correspondence.",
        },
      ];
  }
}

export function buildAnalysisCards(input: {
  classification: ClassificationResult;
  entities: ExtractedEntities;
  legalAttention: LegalAttentionResult;
}): DocumentAnalysisCards {
  const actions = recommendedActionsForType(
    input.classification.documentType,
    input.legalAttention,
  );

  return {
    documentSummary: buildSummary(input.classification, input.entities),
    whoSentIt: {
      senderName: input.entities.senderName,
      collectorName: input.entities.collectorName,
      creditorName: input.entities.creditorName,
      accountReference: input.entities.accountReference,
      contactPhone: input.entities.contactPhone,
      contactEmail: input.entities.contactEmail,
      contactAddress: input.entities.contactAddress,
    },
    importantDates: {
      documentDate: input.entities.documentDate,
      responseDeadline: input.entities.responseDeadline,
      courtDate: input.entities.courtDate,
    },
    whatMinaNoticed: buildWhatMinaNoticed(
      input.classification,
      input.entities,
      input.legalAttention,
    ),
    recommendedNextStep: actions[0],
    supportingActions: actions.slice(1),
  };
}

export function getDocumentTypeLabel(documentType: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[documentType];
}
