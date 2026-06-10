import Link from "next/link";

import { WHISPER_PRESSURE_COLORS } from "@/lib/live-call/whisper/design-tokens";
import type { SituationDetailSnapshot } from "@/types/situations";

interface SituationRecoveryCardProps {
  situation: SituationDetailSnapshot;
}

export function SituationRecoveryCard({ situation }: SituationRecoveryCardProps) {
  const pressureColor = WHISPER_PRESSURE_COLORS[situation.signals.pressure];

  return (
    <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
        Recovery snapshot
      </p>

      <dl className="mt-3 space-y-2">
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-white/45">Pressure level</dt>
          <dd className="text-sm font-semibold" style={{ color: pressureColor }}>
            {situation.signals.pressure}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-white/45">Recovery progress</dt>
          <dd className="text-sm text-white/80">
            {situation.recoveryStageLabel ?? situation.recoveryStatus}
          </dd>
        </div>
        {situation.emergencyFundNote ? (
          <div className="rounded-xl border border-white/6 bg-[#0F172A] px-3 py-3">
            <p className="text-xs leading-relaxed text-white/60">{situation.emergencyFundNote}</p>
          </div>
        ) : null}
      </dl>

      <Link
        href="/recovery"
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-2.5 text-sm font-semibold text-[#22C55E] transition hover:bg-[#22C55E]/20"
      >
        View Recovery Plan
      </Link>
    </section>
  );
}
