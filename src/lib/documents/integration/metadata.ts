import type {
  DocumentConfirmedData,
  DocumentIntegrationMetadata,
} from "@/types/document-confirm";

export const INTEGRATION_STATUSES = [
  "integration_started",
  "integration_ready",
] as const;

export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export function parseConfirmedData(
  raw: Record<string, unknown> | null,
): DocumentConfirmedData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  return raw as unknown as DocumentConfirmedData;
}

export function getIntegrationMetadata(
  confirmedData: Record<string, unknown> | null,
): DocumentIntegrationMetadata | null {
  const parsed = parseConfirmedData(confirmedData);

  if (!parsed?.integration) {
    return null;
  }

  const integration = parsed.integration;

  if (
    typeof integration !== "object" ||
    integration === null ||
    !("status" in integration) ||
    !("started_at" in integration)
  ) {
    return null;
  }

  return integration;
}

export function isIntegrationReady(
  confirmedData: Record<string, unknown> | null,
): boolean {
  const integration = getIntegrationMetadata(confirmedData);

  return integration?.status === "integration_ready";
}

export function withIntegrationMetadata(
  confirmedData: DocumentConfirmedData,
  integration: DocumentIntegrationMetadata,
): DocumentConfirmedData {
  return {
    ...confirmedData,
    integration,
  };
}

export function buildIntegrationStarted(
  previous: DocumentIntegrationMetadata | null,
  startedAt: string,
): DocumentIntegrationMetadata {
  return {
    status: "integration_started",
    started_at: startedAt,
    attempt_count: (previous?.attempt_count ?? 0) + 1,
    entities: previous?.entities,
    timeline: previous?.timeline,
    legal_attention: previous?.legal_attention,
    dashboard_intelligence: previous?.dashboard_intelligence,
  };
}

export function buildIntegrationReady(
  started: DocumentIntegrationMetadata,
  readyAt: string,
): DocumentIntegrationMetadata {
  return {
    ...started,
    status: "integration_ready",
    ready_at: readyAt,
    integrated_at: readyAt,
  };
}
