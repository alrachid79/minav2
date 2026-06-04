import type { OnboardingSection } from "@/lib/onboarding/questions";

export const ANALYSIS_RESULT_SCREEN_IDS = [
  "results_understanding",
  "results_pressure",
  "results_recovery",
  "results_actions",
  "results_complete",
] as const;

export type AnalysisResultScreenId = (typeof ANALYSIS_RESULT_SCREEN_IDS)[number];

export interface ResultScreenMeta {
  id: AnalysisResultScreenId;
  title: string;
  subtitle?: string;
  section: OnboardingSection;
  heroMessage: string;
  primaryLabel: string;
}

export const RESULT_SCREEN_META: Record<AnalysisResultScreenId, ResultScreenMeta> =
  {
    results_understanding: {
      id: "results_understanding",
      title: "Here's what Mina understands",
      subtitle: "Based on what you shared — in plain language.",
      section: "results",
      heroMessage: "This is your picture, not a judgment.",
      primaryLabel: "Continue",
    },
    results_pressure: {
      id: "results_pressure",
      title: "Your pressure profile",
      subtitle: "Where the weight is coming from right now.",
      section: "results",
      heroMessage: "Naming pressure is the first step toward relief.",
      primaryLabel: "Continue",
    },
    results_recovery: {
      id: "results_recovery",
      title: "Your recovery stage",
      subtitle: "Where Mina sees you on the path forward.",
      section: "results",
      heroMessage: "Stages shift as you progress — this is where you are today.",
      primaryLabel: "Continue",
    },
    results_actions: {
      id: "results_actions",
      title: "Recommended next steps",
      subtitle: "One primary action, with supporting moves when you're ready.",
      section: "results",
      heroMessage: "Small, clear steps beat trying to fix everything at once.",
      primaryLabel: "Continue",
    },
    results_complete: {
      id: "results_complete",
      title: "You now have a clearer picture of your situation.",
      subtitle: "Your answers and analysis are saved on this device.",
      section: "results",
      heroMessage: "You've done something important today — you named what's going on.",
      primaryLabel: "Save my profile",
    },
  };

export function isAnalysisResultScreen(
  screenId: string,
): screenId is AnalysisResultScreenId {
  return ANALYSIS_RESULT_SCREEN_IDS.includes(screenId as AnalysisResultScreenId);
}

export function getResultScreenMeta(
  screenId: string,
): ResultScreenMeta | undefined {
  if (!isAnalysisResultScreen(screenId)) {
    return undefined;
  }

  return RESULT_SCREEN_META[screenId];
}

export const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  document_analysis: "Document Analysis",
  letter_generator: "Letter Generator",
  decision_shield: "Decision Shield",
  legal_support: "Legal Support",
  live_call: "Decision Shield",
  dashboard: "Your Dashboard",
};

export function getFeatureDisplayName(targetFeature: string): string {
  return (
    FEATURE_DISPLAY_NAMES[targetFeature] ??
    targetFeature.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}
