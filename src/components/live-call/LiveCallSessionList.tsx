import Link from "next/link";

import { LIVE_CALL_SESSION_STATUS_LABELS } from "@/lib/live-call/constants";
import type { LiveCallSessionListItem } from "@/types/live-call";

interface LiveCallSessionListProps {
  sessions: LiveCallSessionListItem[];
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LiveCallSessionList({ sessions }: LiveCallSessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-8 text-center">
        <p className="text-sm text-[#64748B]">
          No call sessions yet. Start one when you need coaching during or after a
          collector call.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            href={`/live-call/${session.id}`}
            className="block rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4 transition hover:border-[#14B8A6]/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium text-[#0F172A]">
                  {session.collector_name ?? "Call coaching session"}
                </p>
                <p className="text-xs text-[#64748B]">
                  {formatSessionDate(session.started_at)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#475569]">
                {LIVE_CALL_SESSION_STATUS_LABELS[session.status]}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#64748B]">
              {session.message_count} message{session.message_count === 1 ? "" : "s"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
