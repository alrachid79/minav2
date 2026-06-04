import { OptionCard } from "@/components/onboarding/OptionCard";
import { PressureSlider } from "@/components/onboarding/PressureSlider";
import { StateSelect } from "@/components/onboarding/StateSelect";
import type { OnboardingScreenDefinition } from "@/lib/onboarding/questions";
import type { StressSliderValue } from "@/types/onboarding";

interface OnboardingScreenContentProps {
  screen: OnboardingScreenDefinition;
  value: string | string[] | number | null;
  onSingleSelect: (value: string) => void;
  onMultiToggle: (value: string) => void;
  onSliderChange: (value: StressSliderValue) => void;
  onStateChange: (value: string) => void;
}

export function OnboardingScreenContent({
  screen,
  value,
  onSingleSelect,
  onMultiToggle,
  onSliderChange,
  onStateChange,
}: OnboardingScreenContentProps) {
  if (screen.inputType === "welcome" || screen.inputType === "interstitial") {
    return null;
  }

  if (screen.inputType === "state_select") {
    return (
      <StateSelect
        value={typeof value === "string" ? value : null}
        onChange={onStateChange}
      />
    );
  }

  if (screen.inputType === "slider") {
    return (
      <PressureSlider
        value={typeof value === "number" ? (value as StressSliderValue) : null}
        min={screen.sliderMin ?? 1}
        max={screen.sliderMax ?? 5}
        lowLabel={screen.sliderLowLabel ?? "Low"}
        highLabel={screen.sliderHighLabel ?? "High"}
        onChange={onSliderChange}
      />
    );
  }

  if (!screen.options?.length) {
    return null;
  }

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {screen.options.map((option) => (
        <OptionCard
          key={option.value}
          label={option.label}
          selected={selectedValues.includes(option.value)}
          onSelect={() =>
            screen.multiSelect
              ? onMultiToggle(option.value)
              : onSingleSelect(option.value)
          }
        />
      ))}
    </div>
  );
}
