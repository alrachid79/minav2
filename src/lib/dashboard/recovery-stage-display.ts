import type { RecoveryStage } from "@/types/onboarding";

export const RECOVERY_STAGE_ORDER = [
  "stabilize",
  "understand",
  "protect",
  "act",
  "resolve",
  "recover",
] as const satisfies readonly RecoveryStage[];

export function getRecoveryStageIndex(stage: RecoveryStage): number {
  return RECOVERY_STAGE_ORDER.indexOf(stage);
}

export const RECOVERY_STAGE_LABELS: Record<RecoveryStage, string> = {
  stabilize: "Stabilize",
  understand: "Understand",
  protect: "Protect",
  act: "Act",
  resolve: "Resolve",
  recover: "Recover",
};

export const RECOVERY_STAGE_DESCRIPTIONS: Record<RecoveryStage, string> = {
  stabilize:
    "You're in a grounding phase — reducing overwhelm before bigger decisions.",
  understand:
    "You're building clarity about what's happening and what it means for you.",
  protect:
    "You're focused on timing, careful responses, and protecting your options.",
  act: "You have enough context to take structured, confident steps forward.",
  resolve:
    "You're working toward closure on open situations with deliberate action.",
  recover:
    "You're rebuilding stability and confidence after a period of pressure.",
};

export function isRecoveryStage(value: string): value is RecoveryStage {
  return value in RECOVERY_STAGE_LABELS;
}
