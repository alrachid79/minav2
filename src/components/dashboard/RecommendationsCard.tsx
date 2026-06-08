import Link from "next/link";

import {
  DashboardCard,
  DashboardEmptyState,
} from "@/components/dashboard/DashboardCard";
import type { DashboardRecommendationSnapshot } from "@/types/dashboard";

interface RecommendationsCardProps {
  primary: DashboardRecommendationSnapshot | null;
  secondary: DashboardRecommendationSnapshot[];
}

function recommendationHref(targetFeature: string): string | null {
  switch (targetFeature) {
    case "document_analysis":
      return "/documents";
    case "letter_generator":
      return "/letters";
    case "live_call":
      return "/live-call";
    default:
      return null;
  }
}

export function RecommendationsCard({
  primary,
  secondary,
}: RecommendationsCardProps) {
  if (!primary && secondary.length === 0) {
    return (
      <DashboardCard
        eyebrow="Command center"
        title="Your next step"
        accent="gold"
        variant="default"
        className="h-full"
      >
        <DashboardEmptyState message="Recommendations will appear here as Mina learns from your confirmed documents." />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      eyebrow="Command center"
      title="Your next step"
      accent="gold"
      variant="default"
      className="h-full"
    >
      <div className="space-y-5">
        {primary ? (
          <div className="overflow-hidden rounded-2xl border-2 border-[#0F172A] bg-[#0F172A] text-white shadow-lg">
            <div className="border-b border-white/10 px-4 py-2 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4A017]">
                Primary recommendation
              </p>
            </div>
            <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-base font-semibold leading-snug sm:text-lg">
                {primary.title}
              </p>
              <p className="text-sm leading-relaxed text-white/75">{primary.reason}</p>
              {recommendationHref(primary.targetFeature) ? (
                <Link
                  href={recommendationHref(primary.targetFeature)!}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D9488] sm:w-auto"
                >
                  Take this step
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {secondary.length > 0 ? (
          <div className="rounded-2xl border border-[#0F172A]/10 bg-[#F8FAFC] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
              Also worth considering
            </p>
            <ul className="mt-3 divide-y divide-[#0F172A]/8">
              {secondary.slice(0, 3).map((recommendation) => (
                <li key={recommendation.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {recommendation.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
                    {recommendation.reason}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
