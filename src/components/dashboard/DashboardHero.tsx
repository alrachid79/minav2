import Link from "next/link";

import { WHISPER_MODE_TAGLINE } from "@/lib/live-call/constants";
import { formatDashboardDate } from "@/components/dashboard/DashboardCard";
import type { DashboardSnapshot } from "@/types/dashboard";

interface DashboardHeroProps {
  snapshot: DashboardSnapshot;
}

export function DashboardHero({ snapshot }: DashboardHeroProps) {
  const stageLabel = snapshot.recoveryStage.currentStageLabel ?? "Getting started";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] px-5 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:px-8 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#14B8A6]/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-[#D4A017]/10 blur-3xl"
      />

      <div className="relative">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4A017]">
              Financial Stress Recovery Coach
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Mina Whisper Mode
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              {WHISPER_MODE_TAGLINE}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-[#D4A017]/30 bg-white/5 px-5 py-4 backdrop-blur-sm sm:min-w-[11rem] sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#14B8A6]">
              Recovery stage
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
              {stageLabel}
            </p>
            {snapshot.recoveryStage.stageChangedAt ? (
              <p className="mt-1 text-xs text-white/50">
                Updated {formatDashboardDate(snapshot.recoveryStage.stageChangedAt)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/live-call"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#D4A017] px-6 py-3 text-sm font-bold text-[#0F172A] transition hover:bg-[#E4B429] sm:w-auto"
          >
            Start Whisper Mode
          </Link>
          <Link
            href="/situations"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-[#D4A017]/50 bg-[#D4A017]/10 px-6 py-3 text-sm font-bold text-[#D4A017] transition hover:bg-[#D4A017]/20 sm:w-auto"
          >
            My Situation
          </Link>
          <Link
            href="/recovery"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 px-5 py-2.5 text-sm font-semibold text-[#22C55E] transition hover:bg-[#22C55E]/20 sm:w-auto"
          >
            Recovery Plan
          </Link>
          <Link
            href="/documents"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            Analyze Letter
          </Link>
          <Link
            href="/letters"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            Draft Letter
          </Link>
        </div>
      </div>
    </section>
  );
}
