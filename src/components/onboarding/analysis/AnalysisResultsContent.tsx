import { AnalysisCompleteView } from "@/components/onboarding/analysis/AnalysisCompleteView";
import { AnalysisLoadingView } from "@/components/onboarding/analysis/AnalysisLoadingView";
import { MinaUnderstandingView } from "@/components/onboarding/analysis/MinaUnderstandingView";
import { PressureProfileView } from "@/components/onboarding/analysis/PressureProfileView";
import { RecoveryStageView } from "@/components/onboarding/analysis/RecoveryStageView";
import { RecommendedActionsView } from "@/components/onboarding/analysis/RecommendedActionsView";
import type { AnalysisResultScreenId } from "@/lib/onboarding/resultScreens";
import type { GuestOnboardingSession } from "@/types/onboarding";

interface AnalysisResultsContentProps {
  screenId: string;
  session: GuestOnboardingSession;
}

export function AnalysisResultsContent({
  screenId,
  session,
}: AnalysisResultsContentProps) {
  if (screenId === "analysis_loading") {
    return <AnalysisLoadingView />;
  }

  const { analysis, pressure_profile, recovery_path, answers } = session;

  if (!analysis || !pressure_profile || !recovery_path) {
    return <AnalysisLoadingView />;
  }

  switch (screenId as AnalysisResultScreenId) {
    case "results_understanding":
      return <MinaUnderstandingView analysis={analysis} />;
    case "results_pressure":
      return (
        <PressureProfileView
          answers={answers}
          pressureProfile={pressure_profile}
        />
      );
    case "results_recovery":
      return <RecoveryStageView recoveryPath={recovery_path} />;
    case "results_actions":
      return (
        <RecommendedActionsView
          analysis={analysis}
          recoveryPath={recovery_path}
        />
      );
    case "results_complete":
      return <AnalysisCompleteView />;
    default:
      return null;
  }
}
