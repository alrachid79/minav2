import Link from "next/link";

import {
  DashboardCard,
  DashboardEmptyState,
  formatDashboardDate,
} from "@/components/dashboard/DashboardCard";
import { MINA_GETTING_STARTED_COPY } from "@/lib/ui/empty-state-copy";
import type { DashboardRecentDocumentSnapshot } from "@/types/dashboard";

interface RecentDocumentsCardProps {
  documents: DashboardRecentDocumentSnapshot[];
  compact?: boolean;
}

export function RecentDocumentsCard({
  documents,
  compact = false,
}: RecentDocumentsCardProps) {
  return (
    <DashboardCard
      eyebrow="Documents"
      title="Recent uploads"
      accent="teal"
      variant={compact ? "nested" : "default"}
      className="h-full"
    >
      {documents.length === 0 ? (
        <DashboardEmptyState message={MINA_GETTING_STARTED_COPY} />
      ) : (
        <ul className="space-y-2.5">
          {documents.map((document) => (
            <li
              key={document.id}
              className="rounded-xl border border-[#0F172A]/8 bg-white px-3.5 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0F172A]">
                    {document.filename}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {document.documentTypeLabel} · {formatDashboardDate(document.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#F0FDFA] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#0F766E]">
                  {document.processingStateLabel}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/documents"
        className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[#14B8A6] hover:text-[#0F172A]"
      >
        Upload a document →
      </Link>
    </DashboardCard>
  );
}
