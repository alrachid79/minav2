import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { LegalAttentionCard } from "@/components/dashboard/LegalAttentionCard";
import { RecentActivitySection } from "@/components/dashboard/RecentActivitySection";
import { RecommendationsCard } from "@/components/dashboard/RecommendationsCard";
import { RecoveryStageCard } from "@/components/dashboard/RecoveryStageCard";
import type { DashboardSnapshot } from "@/types/dashboard";

interface DashboardExperienceProps {
  snapshot: DashboardSnapshot;
}

export function DashboardExperience({ snapshot }: DashboardExperienceProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardHero snapshot={snapshot} />

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-7">
          <RecoveryStageCard recoveryStage={snapshot.recoveryStage} />
        </div>
        <div className="lg:col-span-5">
          <RecommendationsCard
            primary={snapshot.recommendations.primary}
            secondary={snapshot.recommendations.secondary}
          />
        </div>
      </div>

      <LegalAttentionCard events={snapshot.legalAttentionEvents} />

      <RecentActivitySection snapshot={snapshot} />
    </div>
  );
}
