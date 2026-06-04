import "server-only";

import { ENTITY_FIELD_KEYS } from "@/lib/documents/intelligence/field-keys";
import {
  confirmedFieldHasValue,
  readConfirmedFieldValue,
} from "@/lib/documents/integration/confirmed-field-utils";
import {
  isDebtRelatedDocumentType,
  mapDocumentTypeToDebtCategory,
} from "@/lib/documents/integration/map-document-category";
import { namesMatch, normalizeEntityName } from "@/lib/documents/integration/normalize-name";
import type { DocumentConfirmedData } from "@/types/document-confirm";
import type { DocumentExtractedField } from "@/types/documents";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface LinkedEntityRecord {
  id: string;
  name: string;
  created: boolean;
  created_from_document: boolean;
  source_document_id: string;
  confidence_score: number | null;
}

export interface LinkedDebtSituationRecord {
  id: string;
  category: string;
  label: string | null;
  created: boolean;
  created_from_document: boolean;
  source_document_id: string;
  confidence_score: number | null;
}

export interface EntityIntegrationResult {
  collector: LinkedEntityRecord | null;
  creditor: LinkedEntityRecord | null;
  debtSituation: LinkedDebtSituationRecord | null;
  documentLinks: {
    collector_id: string | null;
    creditor_id: string | null;
    debt_situation_id: string | null;
  };
}

function getFieldConfidence(
  fields: DocumentExtractedField[],
  fieldKey: string,
): number | null {
  const match = fields.find((field) => field.field_key === fieldKey);

  if (match?.confidence_score === null || match?.confidence_score === undefined) {
    return null;
  }

  return Number(match.confidence_score);
}

function readExtractedContact(
  fields: DocumentExtractedField[],
  fieldKey: string,
): string | null {
  const match = fields.find((field) => field.field_key === fieldKey);

  return match?.field_value?.trim() || null;
}

export function hasDebtRelatedInformation(
  confirmedData: DocumentConfirmedData,
): boolean {
  if (isDebtRelatedDocumentType(confirmedData.document_type)) {
    return true;
  }

  return (
    confirmedFieldHasValue(confirmedData.collector_name) ||
    confirmedFieldHasValue(confirmedData.creditor_name) ||
    confirmedFieldHasValue(confirmedData.balance_amount)
  );
}

function buildDebtSituationLabel(input: {
  confirmedData: DocumentConfirmedData;
  collectorName: string | null;
  creditorName: string | null;
  originalFilename: string;
}): string | null {
  if (readConfirmedFieldValue(input.confirmedData.balance_amount)) {
    return `Balance ${input.confirmedData.balance_amount.value.trim()} (as stated on document)`;
  }

  if (input.collectorName && input.creditorName) {
    return `${input.collectorName} → ${input.creditorName}`;
  }

  if (input.collectorName) {
    return input.collectorName;
  }

  if (input.creditorName) {
    return input.creditorName;
  }

  return `From ${input.originalFilename}`;
}

async function findCollectorByName(
  supabase: SupabaseClient,
  userId: string,
  name: string,
) {
  const { data, error } = await supabase
    .from("collectors")
    .select("id, name")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).find((collector) => namesMatch(collector.name, name)) ?? null;
}

async function findCreditorByName(
  supabase: SupabaseClient,
  userId: string,
  name: string,
) {
  const { data, error } = await supabase
    .from("creditors")
    .select("id, name")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).find((creditor) => namesMatch(creditor.name, name)) ?? null;
}

async function findDebtSituationMatch(
  supabase: SupabaseClient,
  userId: string,
  input: {
    category: string;
    collectorId: string | null;
    creditorId: string | null;
  },
) {
  let query = supabase
    .from("debt_situations")
    .select("id, category, label, collector_id, creditor_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("category", input.category);

  if (input.collectorId) {
    query = query.eq("collector_id", input.collectorId);
  } else {
    query = query.is("collector_id", null);
  }

  if (input.creditorId) {
    query = query.eq("creditor_id", input.creditorId);
  } else {
    query = query.is("creditor_id", null);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function integrateDocumentEntities(input: {
  supabase: SupabaseClient;
  userId: string;
  documentId: string;
  originalFilename: string;
  confirmedData: DocumentConfirmedData;
  extractedFields: DocumentExtractedField[];
  existingCollectorId?: string | null;
  existingCreditorId?: string | null;
  existingDebtSituationId?: string | null;
}): Promise<EntityIntegrationResult> {
  const collectorName = readConfirmedFieldValue(input.confirmedData.collector_name);
  const creditorName = readConfirmedFieldValue(input.confirmedData.creditor_name);
  const collectorConfidence = getFieldConfidence(
    input.extractedFields,
    ENTITY_FIELD_KEYS.collectorName,
  );
  const creditorConfidence = getFieldConfidence(
    input.extractedFields,
    ENTITY_FIELD_KEYS.creditorName,
  );

  let collector: LinkedEntityRecord | null = null;
  let creditor: LinkedEntityRecord | null = null;
  let debtSituation: LinkedDebtSituationRecord | null = null;

  if (input.existingCollectorId && collectorName) {
    const { data } = await input.supabase
      .from("collectors")
      .select("id, name")
      .eq("id", input.existingCollectorId)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (data) {
      collector = {
        id: data.id,
        name: data.name,
        created: false,
        created_from_document: true,
        source_document_id: input.documentId,
        confidence_score: collectorConfidence,
      };
    }
  }

  if (!collector && collectorName) {
    const existing = await findCollectorByName(
      input.supabase,
      input.userId,
      collectorName,
    );

    if (existing) {
      collector = {
        id: existing.id,
        name: existing.name,
        created: false,
        created_from_document: true,
        source_document_id: input.documentId,
        confidence_score: collectorConfidence,
      };
    } else {
      const { data, error } = await input.supabase
        .from("collectors")
        .insert({
          user_id: input.userId,
          name: collectorName,
          phone: readExtractedContact(
            input.extractedFields,
            ENTITY_FIELD_KEYS.contactPhone,
          ),
          address: readExtractedContact(
            input.extractedFields,
            ENTITY_FIELD_KEYS.contactAddress,
          ),
        })
        .select("id, name")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create collector.");
      }

      collector = {
        id: data.id,
        name: data.name,
        created: true,
        created_from_document: true,
        source_document_id: input.documentId,
        confidence_score: collectorConfidence,
      };
    }
  }

  if (input.existingCreditorId && creditorName) {
    const { data } = await input.supabase
      .from("creditors")
      .select("id, name")
      .eq("id", input.existingCreditorId)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (data) {
      creditor = {
        id: data.id,
        name: data.name,
        created: false,
        created_from_document: true,
        source_document_id: input.documentId,
        confidence_score: creditorConfidence,
      };
    }
  }

  if (!creditor && creditorName) {
    const existing = await findCreditorByName(
      input.supabase,
      input.userId,
      creditorName,
    );

    if (existing) {
      creditor = {
        id: existing.id,
        name: existing.name,
        created: false,
        created_from_document: true,
        source_document_id: input.documentId,
        confidence_score: creditorConfidence,
      };
    } else {
      const { data, error } = await input.supabase
        .from("creditors")
        .insert({
          user_id: input.userId,
          name: creditorName,
        })
        .select("id, name")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create creditor.");
      }

      creditor = {
        id: data.id,
        name: data.name,
        created: true,
        created_from_document: true,
        source_document_id: input.documentId,
        confidence_score: creditorConfidence,
      };
    }
  }

  if (input.existingDebtSituationId && hasDebtRelatedInformation(input.confirmedData)) {
    const { data } = await input.supabase
      .from("debt_situations")
      .select("id, category, label")
      .eq("id", input.existingDebtSituationId)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (data) {
      debtSituation = {
        id: data.id,
        category: data.category,
        label: data.label,
        created: false,
        created_from_document: true,
        source_document_id: input.documentId,
        confidence_score: getFieldConfidence(
          input.extractedFields,
          ENTITY_FIELD_KEYS.classificationConfidence,
        ),
      };
    }
  }

  if (!debtSituation && hasDebtRelatedInformation(input.confirmedData)) {
    const category = mapDocumentTypeToDebtCategory(input.confirmedData.document_type);
    const label = buildDebtSituationLabel({
      confirmedData: input.confirmedData,
      collectorName,
      creditorName,
      originalFilename: input.originalFilename,
    });
    const collectorId = collector?.id ?? null;
    const creditorId = creditor?.id ?? null;

    const existing = await findDebtSituationMatch(input.supabase, input.userId, {
      category,
      collectorId,
      creditorId,
    });

    if (existing) {
      debtSituation = {
        id: existing.id,
        category: existing.category,
        label: existing.label,
        created: false,
        created_from_document: true,
        source_document_id: input.documentId,
        confidence_score: getFieldConfidence(
          input.extractedFields,
          ENTITY_FIELD_KEYS.classificationConfidence,
        ),
      };
    } else {
      const { data, error } = await input.supabase
        .from("debt_situations")
        .insert({
          user_id: input.userId,
          category,
          label,
          status: "active",
          collector_id: collectorId,
          creditor_id: creditorId,
        })
        .select("id, category, label")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create debt situation.");
      }

      debtSituation = {
        id: data.id,
        category: data.category,
        label: data.label,
        created: true,
        created_from_document: true,
        source_document_id: input.documentId,
        confidence_score: getFieldConfidence(
          input.extractedFields,
          ENTITY_FIELD_KEYS.classificationConfidence,
        ),
      };
    }
  }

  const { error: linkError } = await input.supabase
    .from("documents")
    .update({
      collector_id: collector?.id ?? null,
      creditor_id: creditor?.id ?? null,
      debt_situation_id: debtSituation?.id ?? null,
    })
    .eq("id", input.documentId)
    .eq("user_id", input.userId);

  if (linkError) {
    throw new Error(linkError.message);
  }

  return {
    collector,
    creditor,
    debtSituation,
    documentLinks: {
      collector_id: collector?.id ?? null,
      creditor_id: creditor?.id ?? null,
      debt_situation_id: debtSituation?.id ?? null,
    },
  };
}

export function normalizedNameKey(name: string): string {
  return normalizeEntityName(name);
}
