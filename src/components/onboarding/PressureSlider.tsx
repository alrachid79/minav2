import type { StressSliderValue } from "@/types/onboarding";

interface PressureSliderProps {
  value: StressSliderValue | null;
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  onChange: (value: StressSliderValue) => void;
}

export function PressureSlider({
  value,
  min,
  max,
  lowLabel,
  highLabel,
  onChange,
}: PressureSliderProps) {
  const steps = Array.from(
    { length: max - min + 1 },
    (_, index) => (min + index) as StressSliderValue,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step) => {
          const selected = value === step;
          return (
            <button
              key={step}
              type="button"
              onClick={() => onChange(step)}
              aria-pressed={selected}
              className={`flex h-12 w-12 flex-1 max-w-[56px] items-center justify-center rounded-xl text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 ${
                selected
                  ? "border-2 border-[#0F172A] bg-gradient-to-br from-[#14B8A6]/15 to-[#D4A017]/10 text-[#0F172A] shadow-[0_2px_8px_rgba(15,23,42,0.1)]"
                  : "border border-[#0F172A]/10 bg-white text-[#6B7280] hover:border-[#0F172A]/20 hover:text-[#111827]"
              }`}
            >
              {step}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between gap-4 text-xs leading-snug text-[#6B7280]">
        <span className="max-w-[40%]">{lowLabel}</span>
        <span className="max-w-[40%] text-right">{highLabel}</span>
      </div>
    </div>
  );
}
