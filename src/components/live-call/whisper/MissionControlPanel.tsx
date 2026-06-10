import { CapturedProgress } from "@/components/live-call/whisper/CapturedProgress";
import { MissingObjectivesPanel } from "@/components/live-call/whisper/MissingObjectivesPanel";
import { PressureMeter } from "@/components/live-call/whisper/PressureMeter";
import { RealityCheckCard } from "@/components/live-call/whisper/RealityCheckCard";
import { SayNowCard } from "@/components/live-call/whisper/SayNowCard";
import type { LiveCallMinaGuidanceContent } from "@/types/live-call";

interface MissionControlPanelProps {
  guidance: LiveCallMinaGuidanceContent;
}

export function MissionControlPanel({ guidance }: MissionControlPanelProps) {
  const isLegalStage =
    guidance.stage_code === "LEGAL_THREAT" || guidance.stage === "Legal Threat";

  const capturedLabels =
    guidance.format === "whisper_v2" && guidance.captured.length > 0
      ? guidance.captured
      : guidance.captured;

  return (
    <div className="space-y-4 overflow-x-hidden">
      <SayNowCard sayNow={guidance.say_now} />

      <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
          Call stage
        </p>
        <p
          className="mt-1 text-base font-semibold tracking-tight"
          style={{ color: isLegalStage ? "#EF4444" : "#D4A017" }}
        >
          {guidance.stage}
        </p>
      </section>

      <PressureMeter pressure={guidance.pressure} />

      <CapturedProgress
        capturedLabels={capturedLabels}
        missingCount={guidance.missing.length}
      />

      <MissingObjectivesPanel missing={guidance.missing} />

      {guidance.reality_check ? (
        <RealityCheckCard realityCheck={guidance.reality_check} />
      ) : null}
    </div>
  );
}
