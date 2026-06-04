import { ResultCard } from "@/components/onboarding/ResultCard";
import type {
  OnboardingAnswers,
  PressureProfile,
  StressSliderValue,
} from "@/types/onboarding";

interface PressureProfileViewProps {
  answers: OnboardingAnswers;
  pressureProfile: PressureProfile;
}

function sliderLevelLabel(value: StressSliderValue): string {
  const labels: Record<StressSliderValue, string> = {
    1: "Very low",
    2: "Low",
    3: "Moderate",
    4: "High",
    5: "Very high",
  };
  return labels[value];
}

function PressureBar({ value, max = 5 }: { value: number; max?: number }) {
  const percent = Math.round((value / max) * 100);

  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#0F172A]/8">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#14B8A6] to-[#D4A017] transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function PressureDimensionCard({
  label,
  value,
}: {
  label: string;
  value: StressSliderValue;
}) {
  return (
    <div className="rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#0F172A]">{label}</p>
        <span className="text-sm font-medium text-[#6B7280]">
          {sliderLevelLabel(value)}
        </span>
      </div>
      <PressureBar value={value} />
    </div>
  );
}

export function PressureProfileView({
  answers,
  pressureProfile,
}: PressureProfileViewProps) {
  const stress = answers.stress_profile;

  if (!stress) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <PressureDimensionCard
        label="Emotional pressure"
        value={stress.emotional_pressure}
      />
      <PressureDimensionCard
        label="Financial pressure"
        value={stress.financial_pressure}
      />
      <PressureDimensionCard
        label="Legal pressure"
        value={stress.legal_pressure}
      />

      <ResultCard title="Overall pressure" accent="gold">
        <p className="text-lg font-semibold capitalize text-[#0F172A]">
          {pressureProfile.stress_label}
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">
          {pressureProfile.summary ??
            `Pressure sources include ${pressureProfile.pressure_sources.join(", ").toLowerCase()}.`}
        </p>
        <PressureBar
          value={
            pressureProfile.stress_intensity === "low"
              ? 1
              : pressureProfile.stress_intensity === "medium"
                ? 2
                : pressureProfile.stress_intensity === "high"
                  ? 4
                  : 5
          }
        />
      </ResultCard>
    </div>
  );
}
