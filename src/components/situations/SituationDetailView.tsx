import { SituationCallsCard } from "@/components/situations/SituationCallsCard";
import { SituationCurrentOfferCard } from "@/components/situations/SituationCurrentOfferCard";
import { SituationDetailHeader } from "@/components/situations/SituationDetailHeader";
import { SituationDocumentsCard } from "@/components/situations/SituationDocumentsCard";
import { SituationLettersCard } from "@/components/situations/SituationLettersCard";
import { SituationNextActionCard } from "@/components/situations/SituationNextActionCard";
import { SituationRecoveryCard } from "@/components/situations/SituationRecoveryCard";
import { SituationTimelineCard } from "@/components/situations/SituationTimelineCard";
import type { SituationDetailSnapshot } from "@/types/situations";

interface SituationDetailViewProps {
  situation: SituationDetailSnapshot;
}

export function SituationDetailView({ situation }: SituationDetailViewProps) {
  return (
    <div className="space-y-4">
      <SituationDetailHeader situation={situation} />
      <SituationCurrentOfferCard signals={situation.signals} />
      <SituationNextActionCard nextBestAction={situation.nextBestAction} />
      <SituationTimelineCard timeline={situation.timeline} />
      <SituationCallsCard calls={situation.calls} />
      <SituationDocumentsCard documents={situation.documents} />
      <SituationLettersCard letters={situation.letters} />
      <SituationRecoveryCard situation={situation} />
    </div>
  );
}
