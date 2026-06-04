import type { DocumentType } from "@/lib/documents/intelligence/types";

export interface ConfirmFieldValue {
  value: string;
  unknown: boolean;
}

export interface DocumentConfirmFormValues {
  documentType: DocumentType;
  collectorName: ConfirmFieldValue;
  creditorName: ConfirmFieldValue;
  balanceAmount: ConfirmFieldValue;
  documentDate: ConfirmFieldValue;
  responseDeadline: ConfirmFieldValue;
  courtDate: ConfirmFieldValue;
}

export interface DocumentConfirmedData {
  document_type: DocumentType;
  document_summary: string;
  legal_attention_required: boolean;
  collector_name: ConfirmFieldValue;
  creditor_name: ConfirmFieldValue;
  balance_amount: ConfirmFieldValue;
  balance_currency: ConfirmFieldValue;
  document_date: ConfirmFieldValue;
  response_deadline: ConfirmFieldValue;
  court_date: ConfirmFieldValue;
  confirmed_at: string;
  integration?: DocumentIntegrationMetadata;
}

export interface DocumentIntegrationEntitiesMetadata {
  integrated_at: string;
  source_document_id: string;
  collector: LinkedEntityIntegrationRecord | null;
  creditor: LinkedEntityIntegrationRecord | null;
  debt_situation: LinkedDebtSituationIntegrationRecord | null;
}

export interface LinkedEntityIntegrationRecord {
  id: string;
  name: string;
  created: boolean;
  created_from_document: boolean;
  source_document_id: string;
  confidence_score: number | null;
}

export interface LinkedDebtSituationIntegrationRecord {
  id: string;
  category: string;
  label: string | null;
  created: boolean;
  created_from_document: boolean;
  source_document_id: string;
  confidence_score: number | null;
}

export interface DocumentIntegrationTimelineEventRecord {
  event_type: string;
  timeline_event_id: string;
  created: boolean;
  summary: string;
  severity: "info" | "attention";
  occurred_at: string;
}

export interface DocumentIntegrationTimelineMetadata {
  integrated_at: string;
  source_document_id: string;
  events: DocumentIntegrationTimelineEventRecord[];
}

export interface DocumentIntegrationLegalAttentionEventRecord {
  issue_type: string;
  legal_attention_event_id: string;
  created: boolean;
  severity: string;
  indicators: Array<{
    issueType: string;
    matchedPhrase: string;
    confidence: number;
  }>;
  created_at: string;
}

export interface DocumentIntegrationLegalAttentionMetadata {
  integrated_at: string;
  source_document_id: string;
  events: DocumentIntegrationLegalAttentionEventRecord[];
}

export interface DocumentIntegrationDashboardIntelligenceMetadata {
  integrated_at: string;
  source_document_id: string;
  recommendations: Array<{
    recommendation_key: string;
    dashboard_recommendation_id: string;
    title: string;
    priority: "primary" | "secondary";
    created: boolean;
  }>;
  memory_candidates: Array<{
    category: string;
    memory_candidate_id: string;
    summary: string;
    confidence: number | null;
    created: boolean;
  }>;
  recovery: {
    updated: boolean;
    previous_stage: string | null;
    current_stage: string | null;
    stage_reason: string | null;
    stage_changed_at: string | null;
  };
}

export interface DocumentIntegrationMetadata {
  status: "integration_started" | "integration_ready";
  started_at: string;
  ready_at?: string;
  integrated_at?: string;
  attempt_count: number;
  entities?: DocumentIntegrationEntitiesMetadata;
  timeline?: DocumentIntegrationTimelineMetadata;
  legal_attention?: DocumentIntegrationLegalAttentionMetadata;
  dashboard_intelligence?: DocumentIntegrationDashboardIntelligenceMetadata;
}

export interface EntityIntegrationSummary {
  collectorLinked: boolean;
  collectorName: string | null;
  collectorCreated: boolean;
  creditorLinked: boolean;
  creditorName: string | null;
  creditorCreated: boolean;
  debtSituationLinked: boolean;
  debtSituationCreated: boolean;
  debtSituationLabel: string | null;
}

export type ConfirmDocumentResult =
  | {
      status: "success";
      confirmedAt: string;
    }
  | {
      status: "already_confirmed";
      confirmedAt: string;
    }
  | {
      status: "error";
      message: string;
    };

export type IntegrateDocumentResult =
  | {
      status: "success";
      integratedAt: string;
      integrationStatus: "integration_ready";
      entities: EntityIntegrationSummary;
    }
  | {
      status: "already_integrated";
      integratedAt: string;
      entities: EntityIntegrationSummary;
    }
  | {
      status: "error";
      message: string;
    };
