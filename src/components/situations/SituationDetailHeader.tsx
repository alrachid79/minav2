import { WHISPER_PRESSURE_COLORS } from "@/lib/live-call/whisper/design-tokens";
import type { SituationDetailSnapshot } from "@/types/situations";

interface SituationDetailHeaderProps {
  situation: SituationDetailSnapshot;
}

export function SituationDetailHeader({ situation }: SituationDetailHeaderProps) {
  const pressureColor = WHISPER_PRESSURE_COLORS[situation.signals.pressure];

  return (
    <section className="rounded-2xl border border-[#D4A017]/25 bg-[#162033] px-4 py-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4A017]">
        {situation.categoryLabel}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{situation.name}</h1>

      <dl className="mt-4 space-y-2">
        {situation.collectorName ? (
          <div className="flex justify-between gap-3">
            <dt className="text-xs text-white/45">Collector</dt>
            <dd className="text-sm font-medium text-white">{situation.collectorName}</dd>
          </div>
        ) : null}
        {situation.creditorName ? (
          <div className="flex justify-between gap-3">
            <dt className="text-xs text-white/45">Creditor</dt>
            <dd className="text-sm font-medium text-white">{situation.creditorName}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-white/45">Current balance</dt>
          <dd className="font-mono text-sm font-semibold text-white">
            {situation.signals.balance ?? "Not captured yet"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-white/45">Status</dt>
          <dd className="text-sm font-medium text-white">{situation.statusLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-white/45">Pressure</dt>
          <dd className="text-sm font-semibold" style={{ color: pressureColor }}>
            {situation.signals.pressure}
          </dd>
        </div>
      </dl>
    </section>
  );
}
