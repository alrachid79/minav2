import type { DocumentIntegrationLegalAttentionMetadata } from "@/types/document-confirm";

import { getIntegrationMetadata, parseConfirmedData } from "@/lib/documents/integration/metadata";

export function isLegalAttentionIntegrationComplete(
  confirmedData: Record<string, unknown> | null,
): boolean {
  const integration = getIntegrationMetadata(confirmedData);

  return Boolean(integration?.legal_attention?.integrated_at);
}

export function getLegalAttentionIntegrationSummary(
  confirmedData: Record<string, unknown> | null,
): DocumentIntegrationLegalAttentionMetadata | null {
  const parsed = parseConfirmedData(confirmedData);

  return parsed?.integration?.legal_attention ?? null;
}
