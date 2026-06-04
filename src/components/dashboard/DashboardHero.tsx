import Link from "next/link";

import { formatDashboardDate } from "@/components/dashboard/DashboardCard";
import type { DashboardSnapshot } from "@/types/dashboard";

interface DashboardHeroProps {
  snapshot: DashboardSnapshot;
}

function buildQuickSummary(snapshot: DashboardSnapshot): string {
  if (snapshot.recommendations.primary?.reason) {
    return snapshot.recommendations.primary.reason;
  }

  if (snapshot.recoveryStage.stageExplanation) {
    return snapshot.recoveryStage.stageExplanation;
  }

  if (snapshot.legalAttentionEvents.length > 0) {
    return `${snapshot.legalAttentionEvents.length} item${snapshot.legalAttentionEvents.length === 1 ? "" : "s"} flagged for legal attention — review when you're ready.`;
  }

  return "Mina helps you understand financial pressure and take calm, informed next steps.";
}

export function DashboardHero({ snapshot }: DashboardHeroProps) {
  const quickSummary = buildQuickSummary(snapshot);
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
              Financial Pressure Intelligence
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Mina
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              {quickSummary}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-[#D4A017]/30 bg-white/5 px-5 py-4 backdrop-blur-sm sm:min-w-[11rem] sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#14B8A6]">
              Current stage
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
            href="/documents"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#14B8A6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D9488]"
          >
            Analyze a document
          </Link>
          <Link
            href="/letters"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Draft a letter
          </Link>
        </div>
      </div>
    </section>
  );
}
