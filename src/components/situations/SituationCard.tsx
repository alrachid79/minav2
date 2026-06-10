import Link from "next/link";

import { WHISPER_PRESSURE_COLORS } from "@/lib/live-call/whisper/design-tokens";
import type { SituationListItem } from "@/types/situations";

interface SituationCardProps {
  situation: SituationListItem;
}

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SituationCard({ situation }: SituationCardProps) {
  const pressureColor = WHISPER_PRESSURE_COLORS[situation.pressure];

  return (
    <Link
      href={`/situations/${situation.id}`}
      className="block rounded-2xl border border-white/8 bg-[#162033] px-4 py-4 transition hover:border-[#D4A017]/30 hover:bg-[#1a2740]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4A017]">
            {situation.categoryLabel}
          </p>
          <h2 className="mt-1 truncate text-base font-semibold text-white">{situation.name}</h2>
          {(situation.collectorName || situation.creditorName) && (
            <p className="mt-1 truncate text-xs text-white/45">
              {[situation.collectorName, situation.creditorName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: pressureColor, backgroundColor: `${pressureColor}18` }}
        >
          {situation.pressure}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-white/35">Balance</dt>
          <dd className="mt-0.5 font-mono text-sm font-semibold text-white">
            {situation.balance ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-white/35">Latest offer</dt>
          <dd className="mt-0.5 font-mono text-sm font-semibold text-white">
            {situation.latestOffer ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-white/35">Deadline</dt>
          <dd className="mt-0.5 text-sm text-white/75">{situation.deadline ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-white/35">Recovery</dt>
          <dd className="mt-0.5 text-sm text-white/75">{situation.recoveryStatus}</dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2 border-t border-white/8 pt-3">
        <p className="text-xs leading-relaxed text-white/55">
          <span className="font-semibold text-[#22C55E]">Next step: </span>
          {situation.nextBestAction}
        </p>
        {situation.latestActivity ? (
          <p className="text-[11px] text-white/35">
            Latest activity · {situation.latestActivity}
          </p>
        ) : (
          <p className="text-[11px] text-white/35">
            Updated {formatDate(situation.updatedAt) ?? "recently"}
          </p>
        )}
      </div>
    </Link>
  );
}
