import Link from "next/link";

import {
  DashboardCard,
  DashboardEmptyState,
  formatDashboardDate,
} from "@/components/dashboard/DashboardCard";
import type { DashboardRecentLetterSnapshot } from "@/types/dashboard";

interface RecentLettersCardProps {
  letters: DashboardRecentLetterSnapshot[];
  compact?: boolean;
}

export function RecentLettersCard({ letters, compact = false }: RecentLettersCardProps) {
  return (
    <DashboardCard
      eyebrow="Letters"
      title="Recent letters"
      accent="navy"
      variant={compact ? "nested" : "default"}
      className="h-full"
    >
      {letters.length === 0 ? (
        <DashboardEmptyState message="No letters generated yet." />
      ) : (
        <ul className="space-y-2.5">
          {letters.map((letter) => (
            <li key={letter.id}>
              <Link
                href={`/letters/${letter.id}`}
                className="block rounded-xl border border-[#0F172A]/8 bg-white px-3.5 py-3 transition hover:border-[#14B8A6]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {letter.letterTypeLabel}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {formatDashboardDate(letter.createdAt)} · {letter.exportCount} export
                      {letter.exportCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F3F4F6] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#374151]">
                    {letter.statusLabel}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/letters/my"
        className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[#14B8A6] hover:text-[#0F172A]"
      >
        View all letters →
      </Link>
    </DashboardCard>
  );
}
