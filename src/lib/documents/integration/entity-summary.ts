import type {
  DocumentIntegrationEntitiesMetadata,
  EntityIntegrationSummary,
} from "@/types/document-confirm";

import {
  getIntegrationMetadata,
  parseConfirmedData,
} from "@/lib/documents/integration/metadata";

export function isEntityIntegrationComplete(
  confirmedData: Record<string, unknown> | null,
): boolean {
  const integration = getIntegrationMetadata(confirmedData);

  return Boolean(integration?.entities?.integrated_at);
}

export function buildEntityIntegrationSummary(
  entities: DocumentIntegrationEntitiesMetadata | null | undefined,
): EntityIntegrationSummary {
  return {
    collectorLinked: Boolean(entities?.collector),
    collectorName: entities?.collector?.name ?? null,
    collectorCreated: entities?.collector?.created ?? false,
    creditorLinked: Boolean(entities?.creditor),
    creditorName: entities?.creditor?.name ?? null,
    creditorCreated: entities?.creditor?.created ?? false,
    debtSituationLinked: Boolean(entities?.debt_situation),
    debtSituationCreated: entities?.debt_situation?.created ?? false,
    debtSituationLabel: entities?.debt_situation?.label ?? null,
  };
}

export function getEntityIntegrationSummaryFromConfirmedData(
  confirmedData: Record<string, unknown> | null,
): EntityIntegrationSummary {
  const parsed = parseConfirmedData(confirmedData);

  return buildEntityIntegrationSummary(parsed?.integration?.entities);
}
