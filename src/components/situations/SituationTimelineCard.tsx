import type { SituationTimelineItem } from "@/types/situations";

interface SituationTimelineCardProps {
  timeline: SituationTimelineItem[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SituationTimelineCard({ timeline }: SituationTimelineCardProps) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Timeline</p>

      {timeline.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">No events recorded yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {timeline.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-white/6 bg-[#0F172A] px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  className="text-sm font-semibold"
                  style={{ color: event.isLegalAttention ? "#EF4444" : "#FFFFFF" }}
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
              {event.eventCategory === "upcoming_deadline" ? (
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#F59E0B]">
                  Upcoming deadline
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
