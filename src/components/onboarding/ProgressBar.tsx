interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
  sectionLabel: string;
  variant?: "light" | "dark";
}

export function ProgressBar({
  currentStep,
  totalSteps,
  percentComplete,
  sectionLabel,
  variant = "light",
}: ProgressBarProps) {
  const isDark = variant === "dark";

  return (
    <div className="space-y-2.5">
      <div
        className={`flex items-center justify-between text-xs font-medium tracking-wide ${
          isDark ? "text-white/70" : "text-[#6B7280]"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              isDark ? "bg-[#D4A017]" : "bg-[#D4A017]"
            }`}
            aria-hidden
          />
          {sectionLabel}
        </span>
        <span>
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div
        className={`relative h-2 w-full overflow-hidden rounded-full ${
          isDark ? "bg-white/15" : "bg-[#0F172A]/10"
        }`}
        role="progressbar"
        aria-valuenow={percentComplete}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Onboarding progress: ${percentComplete}% complete`}
      >
        <div
          className="relative h-full rounded-full bg-[#D4A017] transition-all duration-500 ease-out"
          style={{ width: `${Math.max(percentComplete, 4)}%` }}
        >
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#D4A017] to-[#E8B84A]"
            aria-hidden
          />
        </div>
      </div>
      <p
        className={`text-[11px] font-medium uppercase tracking-[0.12em] ${
          isDark ? "text-[#D4A017]/90" : "text-[#D4A017]"
        }`}
      >
        Your journey
      </p>
    </div>
  );
}
