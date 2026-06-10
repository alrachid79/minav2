import Link from "next/link";

import { LIVE_CALL_SESSION_STATUS_LABELS } from "@/lib/live-call/constants";
import { MINA_GETTING_STARTED_COPY } from "@/lib/ui/empty-state-copy";
import type { LiveCallSessionListItem } from "@/types/live-call";

interface WhisperModeSessionListProps {
  sessions: LiveCallSessionListItem[];
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function WhisperModeSessionList({ sessions }: WhisperModeSessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D4A017]/20 bg-[#162033] px-4 py-8 text-center">
        <p className="text-sm font-semibold text-white/70">Your call history will appear here</p>
        <p className="mt-2 text-sm leading-relaxed text-white/45">{MINA_GETTING_STARTED_COPY}</p>
        <Link
          href="/live-call"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0F172A] transition hover:bg-[#E4B429]"
        >
          Start Whisper Mode
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            href={`/live-call/${session.id}`}
            className="block rounded-2xl border border-white/8 bg-[#162033] px-4 py-4 transition hover:border-[#D4A017]/35"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium text-white">
                  {session.collector_name ?? "Whisper session"}
                </p>
                <p className="text-xs text-white/40">{formatSessionDate(session.started_at)}</p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-white/55">
                {LIVE_CALL_SESSION_STATUS_LABELS[session.status]}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/35">
              {session.message_count} turn{session.message_count === 1 ? "" : "s"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
