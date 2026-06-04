import {
  BUILTIN_LETTER_TEMPLATES,
  buildLetterVersionContent,
  buildTemplateVariables,
  parseTemplateSections,
  renderLetterSections,
} from "@/lib/letters/templates";
import { buildLetterGenerationSourceData, buildSenderName } from "@/lib/letters/build-source-data";
import type {
  LetterTemplateRecord,
  LetterType,
  LetterVersionContent,
} from "@/types/letters";

export interface GenerateLetterContentInput {
  letterType: LetterType;
  template: LetterTemplateRecord | null;
  generatedAt: string;
  profile: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    state: string;
  };
  sourceData: ReturnType<typeof buildLetterGenerationSourceData>;
}

export function generateLetterContent(
  input: GenerateLetterContentInput,
): LetterVersionContent {
  const templateSections =
    (input.template ? parseTemplateSections(input.template.template_body) : null) ??
    BUILTIN_LETTER_TEMPLATES[input.letterType].sections;

  const senderName = buildSenderName(input.profile);
  const variables = buildTemplateVariables({
    recipientName: input.sourceData.recipientName,
    senderName,
    senderState: input.profile.state,
    accountReference: input.sourceData.accountReference,
    balanceAmount: input.sourceData.balanceAmount,
    creditorName: input.sourceData.creditorName,
    documentDate: input.sourceData.documentDate,
    documentSummary: input.sourceData.documentSummary,
    debtCategory: input.sourceData.debtCategory,
  });

  const renderedSections = renderLetterSections(templateSections, variables);

  return buildLetterVersionContent({
    letterType: input.letterType,
    sections: renderedSections,
    generatedAt: input.generatedAt,
  });
}

export function serializeLetterVersionContent(content: LetterVersionContent): string {
  return JSON.stringify(content);
}

export function parseLetterVersionContent(raw: string): LetterVersionContent | null {
  try {
    const parsed = JSON.parse(raw) as Partial<LetterVersionContent>;

    if (
      typeof parsed.subject !== "string" ||
      typeof parsed.greeting !== "string" ||
      typeof parsed.body !== "string" ||
      typeof parsed.closing !== "string" ||
      typeof parsed.disclaimer !== "string" ||
      typeof parsed.generated_at !== "string" ||
      typeof parsed.letter_type !== "string" ||
      typeof parsed.letter_type_label !== "string"
    ) {
      return null;
    }

    return parsed as LetterVersionContent;
  } catch {
    return null;
  }
}
