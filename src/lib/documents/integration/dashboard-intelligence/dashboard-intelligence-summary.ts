import type { DocumentIntegrationDashboardIntelligenceMetadata } from "@/types/document-confirm";

import { getIntegrationMetadata, parseConfirmedData } from "@/lib/documents/integration/metadata";

export function isDashboardIntelligenceIntegrationComplete(
  confirmedData: Record<string, unknown> | null,
): boolean {
  const integration = getIntegrationMetadata(confirmedData);

  return Boolean(integration?.dashboard_intelligence?.integrated_at);
}

export function getDashboardIntelligenceIntegrationSummary(
  confirmedData: Record<string, unknown> | null,
): DocumentIntegrationDashboardIntelligenceMetadata | null {
  const parsed = parseConfirmedData(confirmedData);

  return parsed?.integration?.dashboard_intelligence ?? null;
}
