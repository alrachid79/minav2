import {
  DEFAULT_RECIPIENT_NAME,
  LETTER_EDUCATIONAL_DISCLAIMER,
  LETTER_TYPE_LABELS,
} from "@/lib/letters/constants";
import type { LetterTemplateSections, LetterType, LetterVersionContent } from "@/types/letters";

export const BUILTIN_LETTER_TEMPLATES: Record<
  LetterType,
  { name: string; sections: LetterTemplateSections }
> = {
  validation: {
    name: LETTER_TYPE_LABELS.validation,
    sections: {
      subject: "Request for debt verification",
      greeting: "Dear {{recipient_name}},",
      body: `I am writing regarding the account referenced below. I received communication about this account and would like to request verification of the debt before taking further steps.

Please provide documentation that shows the amount owed, the original creditor, and how the balance was calculated. If you are not the current owner of this debt, please identify the party that is.

Account reference: {{account_reference}}
Balance listed: {{balance_amount}}
Original creditor referenced: {{creditor_name}}

This message is for informational purposes. I am gathering details to understand the account more clearly.`,
      closing: "Sincerely,\n{{sender_name}}\n{{sender_address_line}}",
    },
  },
  dispute: {
    name: LETTER_TYPE_LABELS.dispute,
    sections: {
      subject: "Dispute of account information",
      greeting: "Dear {{recipient_name}},",
      body: `I am writing to dispute the account information listed below. Based on my review, some details may be inaccurate or incomplete.

Please review the account and provide clarification. I am documenting this for my records while I review the information available to me.

Account reference: {{account_reference}}
Balance listed: {{balance_amount}}
Document date referenced: {{document_date}}

{{document_summary_note}}`,
      closing: "Sincerely,\n{{sender_name}}\n{{sender_address_line}}",
    },
  },
  cease_communication: {
    name: LETTER_TYPE_LABELS.cease_communication,
    sections: {
      subject: "Request to limit contact about this account",
      greeting: "Dear {{recipient_name}},",
      body: `I am writing about the account referenced below. At this time, I am requesting that you limit contact with me regarding this account to written correspondence sent to the address below, except for messages that may be required under applicable law.

Account reference: {{account_reference}}

I am keeping records of communications related to this account as I review my options.`,
      closing: "Sincerely,\n{{sender_name}}\n{{sender_address_line}}",
    },
  },
  hardship: {
    name: LETTER_TYPE_LABELS.hardship,
    sections: {
      subject: "Financial hardship explanation",
      greeting: "Dear {{recipient_name}},",
      body: `I am writing to explain that I am currently experiencing financial hardship that affects my ability to address this account at this time.

I want to provide context about my situation and ask that you note this in your records while I review possible next steps. I am not making any commitment regarding payment in this letter.

Account reference: {{account_reference}}
Balance listed: {{balance_amount}}
Debt category referenced: {{debt_category}}

{{document_summary_note}}`,
      closing: "Sincerely,\n{{sender_name}}\n{{sender_address_line}}",
    },
  },
};

export function parseTemplateSections(
  templateBody: string,
): LetterTemplateSections | null {
  try {
    const parsed = JSON.parse(templateBody) as Partial<LetterTemplateSections>;

    if (
      typeof parsed.subject !== "string" ||
      typeof parsed.greeting !== "string" ||
      typeof parsed.body !== "string" ||
      typeof parsed.closing !== "string"
    ) {
      return null;
    }

    return {
      subject: parsed.subject,
      greeting: parsed.greeting,
      body: parsed.body,
      closing: parsed.closing,
    };
  } catch {
    return null;
  }
}

export function buildLetterVersionContent(input: {
  letterType: LetterType;
  sections: LetterTemplateSections;
  generatedAt: string;
}): LetterVersionContent {
  return {
    subject: input.sections.subject.trim(),
    greeting: input.sections.greeting.trim(),
    body: input.sections.body.trim(),
    closing: input.sections.closing.trim(),
    disclaimer: LETTER_EDUCATIONAL_DISCLAIMER,
    generated_at: input.generatedAt,
    letter_type: input.letterType,
    letter_type_label: LETTER_TYPE_LABELS[input.letterType],
  };
}

export function formatLetterPreview(content: LetterVersionContent): string {
  return [
    `Subject: ${content.subject}`,
    "",
    content.greeting,
    "",
    content.body,
    "",
    content.closing,
  ].join("\n");
}

export interface LetterTemplateVariables {
  recipient_name: string;
  sender_name: string;
  sender_address_line: string;
  account_reference: string;
  balance_amount: string;
  creditor_name: string;
  document_date: string;
  document_summary_note: string;
  debt_category: string;
}

export function applyTemplateVariables(
  template: string,
  variables: LetterTemplateVariables,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in variables) {
      return variables[key as keyof LetterTemplateVariables];
    }

    return match;
  });
}

export function buildTemplateVariables(input: {
  recipientName: string;
  senderName: string;
  senderState: string;
  accountReference: string | null;
  balanceAmount: string | null;
  creditorName: string | null;
  documentDate: string | null;
  documentSummary: string | null;
  debtCategory: string | null;
}): LetterTemplateVariables {
  const senderAddressLine =
    input.senderState.trim().length > 0
      ? `${input.senderName}, ${input.senderState}`
      : input.senderName;

  return {
    recipient_name: input.recipientName || DEFAULT_RECIPIENT_NAME,
    sender_name: input.senderName,
    sender_address_line: senderAddressLine,
    account_reference: input.accountReference ?? "Not provided",
    balance_amount: input.balanceAmount ?? "Not provided",
    creditor_name: input.creditorName ?? "Not provided",
    document_date: input.documentDate ?? "Not provided",
    document_summary_note: input.documentSummary
      ? `Related document summary: ${input.documentSummary}`
      : "No related document summary was linked to this draft.",
    debt_category: input.debtCategory ?? "Not provided",
  };
}

export function renderLetterSections(
  sections: LetterTemplateSections,
  variables: LetterTemplateVariables,
): LetterTemplateSections {
  return {
    subject: applyTemplateVariables(sections.subject, variables),
    greeting: applyTemplateVariables(sections.greeting, variables),
    body: applyTemplateVariables(sections.body, variables),
    closing: applyTemplateVariables(sections.closing, variables),
  };
}
