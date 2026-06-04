import Link from "next/link";

import {
  DashboardCard,
  DashboardEmptyState,
  formatDashboardDate,
} from "@/components/dashboard/DashboardCard";
import type { DashboardLegalAttentionSnapshot } from "@/types/dashboard";

interface LegalAttentionCardProps {
  events: DashboardLegalAttentionSnapshot[];
}

function severityStyles(severity: string): {
  badge: string;
  bar: string;
  label: string;
} {
  switch (severity) {
    case "high":
      return {
        badge: "bg-[#DC2626] text-white",
        bar: "bg-[#DC2626]",
        label: "High priority",
      };
    case "medium":
      return {
        badge: "bg-[#F59E0B] text-[#0F172A]",
        bar: "bg-[#F59E0B]",
        label: "Medium priority",
      };
    default:
      return {
        badge: "bg-[#6B7280] text-white",
        bar: "bg-[#6B7280]",
        label: "Review suggested",
      };
  }
}

export function LegalAttentionCard({ events }: LegalAttentionCardProps) {
  return (
    <DashboardCard
      eyebrow="Legal attention"
      title="Items flagged for review"
      accent="amber"
      variant={events.length > 0 ? "alert" : "default"}
    >
      {events.length === 0 ? (
        <DashboardEmptyState message="No active legal attention events right now." />
      ) : (
        <ul className="space-y-4">
          {events.map((event) => {
            const styles = severityStyles(event.severity);

            return (
              <li
                key={event.id}
                className="relative overflow-hidden rounded-2xl border border-[#F59E0B]/35 bg-white pl-5 pr-4 py-4 shadow-sm"
              >
                <div
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-1.5 ${styles.bar}`}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#0F172A] sm:text-base">
                        {event.issueType ?? "Legal attention item"}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${styles.badge}`}
                      >
                        {event.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-[#92400E]">
                      {styles.label} · Detected {formatDashboardDate(event.createdAt)}
                    </p>
                  </div>
                </div>
                {event.sourceDocumentName ? (
                  <p className="mt-3 text-sm text-[#111827]">
                    Source document:{" "}
                    <Link
                      href="/documents"
                      className="font-semibold text-[#14B8A6] underline-offset-2 hover:text-[#0F172A] hover:underline"
                    >
                      {event.sourceDocumentName}
                    </Link>
                  </p>
                ) : null}
                <p className="mt-3 rounded-lg bg-[#FFFBEB] px-3 py-2 text-xs leading-relaxed text-[#92400E]">
                  Educational flag only — not legal advice, rights determination, or
                  outcome prediction.
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
