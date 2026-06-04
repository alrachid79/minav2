import type { DocumentIntegrationTimelineMetadata } from "@/types/document-confirm";

import { getIntegrationMetadata, parseConfirmedData } from "@/lib/documents/integration/metadata";

export function isTimelineIntegrationComplete(
  confirmedData: Record<string, unknown> | null,
): boolean {
  const integration = getIntegrationMetadata(confirmedData);

  return Boolean(integration?.timeline?.integrated_at);
}

export function getTimelineIntegrationSummary(
  confirmedData: Record<string, unknown> | null,
): DocumentIntegrationTimelineMetadata | null {
  const parsed = parseConfirmedData(confirmedData);

  return parsed?.integration?.timeline ?? null;
}
