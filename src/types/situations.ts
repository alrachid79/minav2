import type { WhisperRealityCheckPayload } from "@/types/live-call";

export type SituationPressureLevel = "Low" | "Medium" | "High";

export type SituationRecoveryStatus = "Getting started" | "In progress" | "Needs attention" | "Stable";

export interface SituationFinancialSignals {
  balance: string | null;
  latestOffer: string | null;
  deadline: string | null;
  paymentTerms: string | null;
  realityCheck: WhisperRealityCheckPayload | null;
  pressure: SituationPressureLevel;
}

export interface SituationListItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  status: string;
  statusLabel: string;
  collectorName: string | null;
  creditorName: string | null;
  balance: string | null;
  latestOffer: string | null;
  deadline: string | null;
  pressure: SituationPressureLevel;
  recoveryStatus: SituationRecoveryStatus;
  latestActivity: string | null;
  latestActivityAt: string | null;
  nextBestAction: string;
  updatedAt: string;
}

export interface SituationsListSnapshot {
  situations: SituationListItem[];
  recoveryStageLabel: string | null;
}

export interface SituationTimelineItem {
  id: string;
  title: string;
  summary: string | null;
  occurredAt: string;
  eventCategory: string;
  severity: string | null;
  isLegalAttention: boolean;
}

export interface SituationCallItem {
  id: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  collectorName: string | null;
}

export interface SituationDocumentItem {
  id: string;
  label: string;
  documentType: string;
  documentTypeLabel: string;
  confirmedAt: string | null;
  createdAt: string;
}

export interface SituationLetterItem {
  id: string;
  letterType: string;
  letterTypeLabel: string;
  status: string;
  statusLabel: string;
  createdAt: string;
}

export interface SituationDetailSnapshot {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  status: string;
  statusLabel: string;
  collectorName: string | null;
  creditorName: string | null;
  signals: SituationFinancialSignals;
  nextBestAction: string;
  recoveryStatus: SituationRecoveryStatus;
  recoveryStageLabel: string | null;
  emergencyFundNote: string | null;
  timeline: SituationTimelineItem[];
  calls: SituationCallItem[];
  documents: SituationDocumentItem[];
  letters: SituationLetterItem[];
  updatedAt: string;
}
