import { ResultCard } from "@/components/onboarding/ResultCard";
import type { RecoveryPath, RecoveryStage } from "@/types/onboarding";

interface RecoveryStageViewProps {
  recoveryPath: RecoveryPath;
}

const STAGE_DISPLAY: Record<RecoveryStage, string> = {
  stabilize: "Stabilize",
  understand: "Understand",
  protect: "Protect",
  act: "Act",
  resolve: "Resolve",
  recover: "Recover",
};

const STAGE_DESCRIPTIONS: Record<RecoveryStage, string> = {
  stabilize:
    "You're in a grounding phase — reducing overwhelm before bigger decisions.",
  understand:
    "You're building clarity about what's happening and what it means for you.",
  protect:
    "You're focused on timing, careful responses, and protecting your options.",
  act:
    "You have enough context to take structured, confident steps forward.",
  resolve:
    "You're working toward closure on open situations with deliberate action.",
  recover:
    "You're rebuilding stability and confidence after a period of pressure.",
};

export function RecoveryStageView({ recoveryPath }: RecoveryStageViewProps) {
  const stage = recoveryPath.current_stage;
  const stageName = STAGE_DISPLAY[stage];

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="rounded-xl border border-[#D4A017]/30 bg-gradient-to-br from-[#D4A017]/10 via-white to-[#14B8A6]/5 px-6 py-6 text-center shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4A017]">
          Your stage
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">
          {stageName}
        </p>
      </div>

      <ResultCard title="What this stage means" accent="teal">
        <p>{STAGE_DESCRIPTIONS[stage]}</p>
      </ResultCard>

      <ResultCard title="Why Mina placed you here" accent="navy">
        <p>{recoveryPath.stage_explanation}</p>
        <p className="mt-3 text-sm text-[#6B7280]">
          This can change as you progress — stages reflect where you are today,
          not where you&apos;ll stay.
        </p>
      </ResultCard>
    </div>
  );
}
