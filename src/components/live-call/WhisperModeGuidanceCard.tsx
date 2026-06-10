import { MissionControlPanel } from "@/components/live-call/whisper/MissionControlPanel";
import { isLegacyGuidance, isWhisperGuidance } from "@/lib/live-call/generate-guidance";
import type {
  LegacyLiveCallMinaGuidanceContent,
  LiveCallMessageRecord,
  LiveCallMinaGuidanceContent,
} from "@/types/live-call";

type GuidanceContent = LiveCallMinaGuidanceContent | LegacyLiveCallMinaGuidanceContent;

interface WhisperModeGuidanceCardProps {
  guidance: GuidanceContent;
  messages: LiveCallMessageRecord[];
}

function LegacyGuidanceFallback({ guidance }: { guidance: LegacyLiveCallMinaGuidanceContent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#162033] p-4">
      <p className="text-xs text-white/50">Legacy session</p>
      <p className="mt-2 text-lg font-semibold text-white">{guidance.suggested_response}</p>
    </div>
  );
}

export function WhisperModeGuidanceCard({ guidance, messages }: WhisperModeGuidanceCardProps) {
  if (isLegacyGuidance(guidance)) {
    return <LegacyGuidanceFallback guidance={guidance} />;
  }

  if (!isWhisperGuidance(guidance)) {
    return null;
  }

  return <MissionControlPanel guidance={guidance} />;
}
