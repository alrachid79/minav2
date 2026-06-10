export type RecoveryPressureLevel = "Low" | "Medium" | "High";

export interface RecoveryTimelineItem {
  id: string;
  title: string;
  summary: string | null;
  occurredAt: string;
  isDeadline: boolean;
  isLegalAttention: boolean;
}

export interface RecoveryPlanSnapshot {
  recoveryScore: number;
  pressureLevel: RecoveryPressureLevel;
  emergencyFund: {
    feelLabel: string | null;
    savingsEstimate: string | null;
    note: string;
  };
  monthlyFlexibility: {
    estimate: string | null;
    note: string;
  };
  recoveryStage: {
    label: string | null;
    description: string | null;
    changedAt: string | null;
  };
  nextRecoveryAction: string;
  activeSituationCount: number;
  recentProgress: RecoveryTimelineItem[];
}
