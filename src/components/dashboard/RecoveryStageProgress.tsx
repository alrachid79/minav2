import {
  getRecoveryStageIndex,
  RECOVERY_STAGE_LABELS,
  RECOVERY_STAGE_ORDER,
} from "@/lib/dashboard/recovery-stage-display";
import type { RecoveryStage } from "@/types/onboarding";

interface RecoveryStageProgressProps {
  currentStage: RecoveryStage | null;
}

export function RecoveryStageProgress({ currentStage }: RecoveryStageProgressProps) {
  const activeIndex = currentStage ? getRecoveryStageIndex(currentStage) : -1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {RECOVERY_STAGE_ORDER.map((stage, index) => {
          const isComplete = activeIndex >= 0 && index < activeIndex;
          const isCurrent = stage === currentStage;

          return (
            <div key={stage} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold sm:h-9 sm:w-9 sm:text-xs ${
                  isCurrent
                    ? "bg-[#D4A017] text-[#0F172A] ring-4 ring-[#D4A017]/25"
                    : isComplete
                      ? "bg-[#14B8A6] text-white"
                      : "bg-[#E5E7EB] text-[#6B7280]"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`hidden text-center text-[10px] font-medium leading-tight sm:block ${
                  isCurrent ? "text-[#0F172A]" : "text-[#6B7280]"
                }`}
              >
                {RECOVERY_STAGE_LABELS[stage]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#D4A017] transition-all"
          style={{
            width:
              activeIndex >= 0
                ? `${((activeIndex + 1) / RECOVERY_STAGE_ORDER.length) * 100}%`
                : "0%",
          }}
        />
      </div>

      {currentStage ? (
        <p className="text-center text-xs text-[#6B7280] sm:hidden">
          Stage {activeIndex + 1} of {RECOVERY_STAGE_ORDER.length}:{" "}
          <span className="font-semibold text-[#0F172A]">
            {RECOVERY_STAGE_LABELS[currentStage]}
          </span>
        </p>
      ) : null}
    </div>
  );
}
