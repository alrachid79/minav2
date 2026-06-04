export const LETTER_TYPES = [
  "validation",
  "dispute",
  "cease_communication",
  "hardship",
] as const;

export type LetterType = (typeof LETTER_TYPES)[number];

export const LETTER_STATUSES = ["draft", "finalized", "exported", "sent"] as const;

export type LetterStatus = (typeof LETTER_STATUSES)[number];

export interface LetterTemplateSections {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
}

export interface LetterVersionContent {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  disclaimer: string;
  generated_at: string;
  letter_type: LetterType;
  letter_type_label: string;
}

export interface LetterRecord {
  id: string;
  user_id: string;
  letter_type: LetterType;
  status: LetterStatus;
  document_id: string | null;
  debt_situation_id: string | null;
  collector_id: string | null;
  letter_template_id: string | null;
  recipient_snapshot: Record<string, unknown> | null;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface LetterVersionRecord {
  id: string;
  letter_id: string;
  version_number: number;
  content: string;
  change_reason: string | null;
  created_at: string;
}

export interface LetterTemplateRecord {
  id: string;
  letter_type: LetterType;
  name: string;
  jurisdiction_scope: string;
  template_body: string;
  is_active: boolean;
  version: number;
}

export interface LetterGeneratorContextOption {
  id: string;
  label: string;
}

export interface LetterGeneratorContext {
  profile: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    state: string;
  };
  collectors: LetterGeneratorContextOption[];
  creditors: LetterGeneratorContextOption[];
  debtSituations: LetterGeneratorContextOption[];
  documents: Array<{
    id: string;
    label: string;
    collectorId: string | null;
    creditorId: string | null;
    debtSituationId: string | null;
  }>;
  templates: LetterTemplateRecord[];
}

export type GenerateLetterResult =
  | {
      status: "success";
      letterId: string;
    }
  | {
      status: "error";
      message: string;
    };

export interface LetterListItem {
  id: string;
  letter_type: LetterType;
  letter_type_label: string;
  status: LetterStatus;
  status_label: string;
  created_at: string;
  last_exported_at: string | null;
  document_filename: string | null;
  current_version: number;
}

export interface LetterVersionSummary {
  id: string;
  version_number: number;
  change_reason: string | null;
  created_at: string;
}

export type GetLetterResult =
  | {
      status: "success";
      letter: LetterRecord;
      content: LetterVersionContent;
      versionCreatedAt: string;
      exportMetadata: import("@/lib/letters/export/types").LetterExportMetadata;
      versions: LetterVersionSummary[];
    }
  | {
      status: "error";
      message: string;
    };
