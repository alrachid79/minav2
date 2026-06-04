import {
  DashboardCard,
  DashboardEmptyState,
  formatDashboardDate,
} from "@/components/dashboard/DashboardCard";
import type { DashboardTimelineEventSnapshot } from "@/types/dashboard";

interface RecentTimelineCardProps {
  events: DashboardTimelineEventSnapshot[];
  compact?: boolean;
}

function severityClassName(severity: string | null): string {
  if (severity === "attention") {
    return "bg-[#F59E0B] text-[#0F172A]";
  }

  return "bg-[#14B8A6]/15 text-[#0F766E]";
}

export function RecentTimelineCard({ events, compact = false }: RecentTimelineCardProps) {
  return (
    <DashboardCard
      eyebrow="Timeline"
      title="Latest events"
      accent="gold"
      variant={compact ? "nested" : "default"}
      className="h-full"
    >
      {events.length === 0 ? (
        <DashboardEmptyState message="Timeline activity will appear after documents are integrated." />
      ) : (
        <ul className="relative space-y-0">
          {events.map((event, index) => (
            <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
              {index < events.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[7px] top-4 h-[calc(100%-0.5rem)] w-px bg-[#0F172A]/10"
                />
              ) : null}
              <span
                aria-hidden
                className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-white ${
                  event.severity === "attention" ? "bg-[#F59E0B]" : "bg-[#14B8A6]"
                }`}
              />
              <div className="min-w-0 flex-1 rounded-xl border border-[#0F172A]/8 bg-white px-3.5 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A]">{event.title}</p>
                    {event.summary ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#6B7280]">
                        {event.summary}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-[#6B7280]">
                      {formatDashboardDate(event.occurredAt)}
                      {event.eventCategory === "upcoming_deadline"
                        ? " · Upcoming deadline"
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 self-start rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] ${severityClassName(event.severity)}`}
                  >
                    {event.severityLabel}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
