import Link from "next/link";

import type { SituationCallItem } from "@/types/situations";

interface SituationCallsCardProps {
  calls: SituationCallItem[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SituationCallsCard({ calls }: SituationCallsCardProps) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Calls</p>

      {calls.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">No calls linked to this situation yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {calls.map((call) => (
            <li key={call.id}>
              <Link
                href={`/live-call/${call.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-[#0F172A] px-3 py-3 transition hover:border-[#D4A017]/25"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {call.collectorName ?? "Whisper Mode session"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {formatDate(call.startedAt)} · {call.messageCount} turns
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
                  {call.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
