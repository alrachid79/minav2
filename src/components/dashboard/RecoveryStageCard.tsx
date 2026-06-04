import {
  DashboardCard,
  DashboardEmptyState,
  formatDashboardDate,
} from "@/components/dashboard/DashboardCard";
import { RecoveryStageProgress } from "@/components/dashboard/RecoveryStageProgress";
import type { DashboardRecoveryStageSnapshot } from "@/types/dashboard";

interface RecoveryStageCardProps {
  recoveryStage: DashboardRecoveryStageSnapshot;
}

export function RecoveryStageCard({ recoveryStage }: RecoveryStageCardProps) {
  return (
    <DashboardCard
      eyebrow="Recovery path"
      title="Where you are today"
      accent="teal"
      variant="featured"
      className="h-full"
    >
      {!recoveryStage.currentStageLabel ? (
        <DashboardEmptyState message="Your recovery stage will appear after onboarding is complete." />
      ) : (
        <div className="space-y-6">
          <RecoveryStageProgress currentStage={recoveryStage.currentStage} />

          <div className="rounded-2xl border border-[#0F172A]/10 bg-white/80 px-4 py-4 text-center sm:px-5">
            <p className="text-3xl font-semibold tracking-tight text-[#0F172A]">
              {recoveryStage.currentStageLabel}
            </p>
            {recoveryStage.stageChangedAt ? (
              <p className="mt-1 text-xs text-[#6B7280]">
                Updated {formatDashboardDate(recoveryStage.stageChangedAt)}
              </p>
            ) : null}
          </div>

          {recoveryStage.stageExplanation ? (
            <div className="rounded-xl bg-[#F8FAFC] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#14B8A6]">
                Stage explanation
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#111827]">
                {recoveryStage.stageExplanation}
              </p>
            </div>
          ) : null}

          {recoveryStage.stageReason ? (
            <div className="border-l-4 border-[#D4A017] pl-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                Why Mina placed you here
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#111827]">
                {recoveryStage.stageReason}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </DashboardCard>
  );
}
