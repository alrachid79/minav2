import { ResultCard } from "@/components/onboarding/ResultCard";
import { MinaReflection } from "@/components/onboarding/MinaReflection";
import type { OnboardingAnalysis } from "@/types/onboarding";

interface MinaUnderstandingViewProps {
  analysis: OnboardingAnalysis;
}

export function MinaUnderstandingView({ analysis }: MinaUnderstandingViewProps) {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <MinaReflection message={analysis.narrative} />

      <ResultCard title="What Mina sees" accent="teal">
        <ul className="space-y-2.5">
          {analysis.what_mina_sees.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#14B8A6]"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </ResultCard>

      <ResultCard title="Biggest risk" accent="navy">
        <p>{analysis.biggest_risk}</p>
      </ResultCard>

      <ResultCard title="Biggest opportunity" accent="gold">
        <p>{analysis.biggest_opportunity}</p>
      </ResultCard>
    </div>
  );
}
