import { getFeatureDisplayName } from "@/lib/onboarding/resultScreens";
import type { OnboardingAnalysis, RecoveryPath } from "@/types/onboarding";

interface RecommendedActionsViewProps {
  analysis: OnboardingAnalysis;
  recoveryPath: RecoveryPath;
}

export function RecommendedActionsView({
  analysis,
  recoveryPath,
}: RecommendedActionsViewProps) {
  const primary = analysis.recommended_next_step;
  const supporting = recoveryPath.steps
    .filter((step) => !step.is_primary)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="rounded-xl border-2 border-[#0F172A] bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1E293B] px-5 py-5 shadow-[0_4px_16px_rgba(15,23,42,0.2)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4A017]">
          Primary next step
        </p>
        <p className="mt-2 text-lg font-semibold leading-snug text-white">
          {primary.title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          {primary.description}
        </p>
        <p className="mt-4 inline-flex rounded-full bg-[#D4A017]/15 px-3 py-1 text-xs font-medium text-[#D4A017]">
          {getFeatureDisplayName(primary.target_feature)}
        </p>
      </div>

      {supporting.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#0F172A]">
            Supporting actions
          </p>
          {supporting.map((step) => (
            <div
              key={step.title}
              className="rounded-xl border border-[#0F172A]/8 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
            >
              <p className="text-sm font-semibold text-[#0F172A]">
                {step.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#6B7280]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
