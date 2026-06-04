import { RecentDocumentsCard } from "@/components/dashboard/RecentDocumentsCard";
import { RecentLettersCard } from "@/components/dashboard/RecentLettersCard";
import { RecentTimelineCard } from "@/components/dashboard/RecentTimelineCard";
import { DashboardSectionHeading } from "@/components/dashboard/DashboardCard";
import type { DashboardSnapshot } from "@/types/dashboard";

interface RecentActivitySectionProps {
  snapshot: Pick<
    DashboardSnapshot,
    "recentTimelineEvents" | "recentDocuments" | "recentLetters"
  >;
}

export function RecentActivitySection({ snapshot }: RecentActivitySectionProps) {
  return (
    <section className="space-y-4 sm:space-y-5">
      <DashboardSectionHeading
        eyebrow="Activity feed"
        title="Recent activity"
        description="Timeline events, uploads, and letters — newest first."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RecentTimelineCard events={snapshot.recentTimelineEvents} compact />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2">
          <RecentDocumentsCard documents={snapshot.recentDocuments} compact />
          <RecentLettersCard letters={snapshot.recentLetters} compact />
        </div>
      </div>
    </section>
  );
}
