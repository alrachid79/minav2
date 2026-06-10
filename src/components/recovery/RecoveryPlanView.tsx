import Link from "next/link";

import { WHISPER_PRESSURE_COLORS } from "@/lib/live-call/whisper/design-tokens";
import {
  MINA_EMPTY_RECOVERY_PROGRESS_COPY,
  MINA_GETTING_STARTED_COPY,
} from "@/lib/ui/empty-state-copy";
import type { RecoveryPlanSnapshot } from "@/types/recovery-plan";

interface RecoveryPlanViewProps {
  snapshot: RecoveryPlanSnapshot;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function scoreColor(score: number): string {
  if (score >= 70) {
    return "#22C55E";
  }

  if (score >= 45) {
    return "#F59E0B";
  }

  return "#EF4444";
}

export function RecoveryPlanView({ snapshot }: RecoveryPlanViewProps) {
  const pressureColor = WHISPER_PRESSURE_COLORS[snapshot.pressureLevel];
  const recoveryColor = scoreColor(snapshot.recoveryScore);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4A017]">
            Recovery score
          </p>
          <p className="mt-2 font-mono text-3xl font-bold" style={{ color: recoveryColor }}>
            {snapshot.recoveryScore}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-white/35">Out of 100</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4A017]">
            Pressure score
          </p>
          <p className="mt-2 text-2xl font-bold" style={{ color: pressureColor }}>
            {snapshot.pressureLevel}
          </p>
          <p className="mt-1 text-xs text-white/45">Based on your active pressure signals</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
          Emergency fund snapshot
        </p>
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between gap-3">
            <dt className="text-xs text-white/45">How it feels</dt>
            <dd className="text-sm font-medium text-white">
              {snapshot.emergencyFund.feelLabel ?? "Not captured yet"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-xs text-white/45">Savings estimate</dt>
            <dd className="font-mono text-sm font-semibold text-white">
              {snapshot.emergencyFund.savingsEstimate ?? "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-white/55">{snapshot.emergencyFund.note}</p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
          Monthly flexibility
        </p>
        <div className="mt-3 flex justify-between gap-3">
          <span className="text-xs text-white/45">Estimated room</span>
          <span className="font-mono text-sm font-semibold text-white">
            {snapshot.monthlyFlexibility.estimate ?? "—"}
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/55">
          {snapshot.monthlyFlexibility.note}
        </p>
      </section>

      <section className="rounded-2xl border border-[#D4A017]/25 bg-[#162033] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4A017]">
          Current recovery stage
        </p>
        <p className="mt-2 text-xl font-semibold text-white">
          {snapshot.recoveryStage.label ?? "Getting started"}
        </p>
        {snapshot.recoveryStage.description ? (
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            {snapshot.recoveryStage.description}
          </p>
        ) : null}
        {snapshot.recoveryStage.changedAt ? (
          <p className="mt-2 text-[11px] text-white/35">
            Updated {formatDate(snapshot.recoveryStage.changedAt)}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#22C55E]/25 bg-[#162033] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#22C55E]">
          Next recovery action
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-white">
          {snapshot.nextRecoveryAction}
        </p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
              Situation summary
            </p>
            <p className="mt-2 text-sm text-white/75">
              {snapshot.activeSituationCount === 0
                ? "Your situations will appear here"
                : `${snapshot.activeSituationCount} active situation${snapshot.activeSituationCount === 1 ? "" : "s"}`}
            </p>
            {snapshot.activeSituationCount === 0 ? (
              <p className="mt-1 text-xs text-white/45">{MINA_GETTING_STARTED_COPY}</p>
            ) : null}
          </div>
          <Link
            href="/situations"
            className="shrink-0 rounded-xl border border-[#D4A017]/30 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#D4A017] transition hover:bg-[#D4A017]/10"
          >
            View
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
          Recent progress
        </p>

        {snapshot.recentProgress.length === 0 ? (
          <p className="mt-3 text-sm text-white/45">{MINA_EMPTY_RECOVERY_PROGRESS_COPY}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {snapshot.recentProgress.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-white/6 bg-[#0F172A] px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: event.isLegalAttention
                        ? "#EF4444"
                        : event.isDeadline
                          ? "#F59E0B"
                          : "#FFFFFF",
                    }}
                  >
                    {event.title}
                  </p>
                  <time className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-white/35">
                    {formatDate(event.occurredAt)}
                  </time>
                </div>
                {event.summary ? (
                  <p className="mt-1 text-xs leading-relaxed text-white/55">{event.summary}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
