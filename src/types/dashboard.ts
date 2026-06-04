import type { DocumentProcessingState } from "@/types/documents";
import type { RecoveryStage } from "@/types/onboarding";

export interface DashboardRecoveryStageSnapshot {
  currentStage: RecoveryStage | null;
  currentStageLabel: string | null;
  stageExplanation: string | null;
  stageReason: string | null;
  stageChangedAt: string | null;
}

export interface DashboardRecommendationSnapshot {
  id: string;
  priority: "primary" | "secondary";
  title: string;
  reason: string;
  targetFeature: string;
  sortOrder: number;
}

export interface DashboardLegalAttentionSnapshot {
  id: string;
  issueType: string | null;
  severity: string;
  createdAt: string;
  sourceDocumentId: string | null;
  sourceDocumentName: string | null;
}

export interface DashboardRecentDocumentSnapshot {
  id: string;
  filename: string;
  documentType: string | null;
  documentTypeLabel: string;
  processingState: DocumentProcessingState;
  processingStateLabel: string;
  createdAt: string;
}

export interface DashboardRecentLetterSnapshot {
  id: string;
  letterTypeLabel: string;
  status: string;
  statusLabel: string;
  exportCount: number;
  createdAt: string;
}

export interface DashboardTimelineEventSnapshot {
  id: string;
  title: string;
  summary: string;
  severity: string | null;
  severityLabel: string;
  occurredAt: string;
  eventCategory: string;
}

export interface DashboardSnapshot {
  recoveryStage: DashboardRecoveryStageSnapshot;
  recommendations: {
    primary: DashboardRecommendationSnapshot | null;
    secondary: DashboardRecommendationSnapshot[];
  };
  legalAttentionEvents: DashboardLegalAttentionSnapshot[];
  recentDocuments: DashboardRecentDocumentSnapshot[];
  recentLetters: DashboardRecentLetterSnapshot[];
  recentTimelineEvents: DashboardTimelineEventSnapshot[];
}
