"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { endLiveCallSession } from "@/app/actions/live-call";
import { LIVE_CALL_SESSION_STATUS_LABELS } from "@/lib/live-call/constants";
import type { LiveCallSessionStatus } from "@/types/live-call";

interface LiveCallSessionHeaderProps {
  sessionId: string;
  status: LiveCallSessionStatus;
  startedAt: string;
  collectorName: string | null;
  isActive: boolean;
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LiveCallSessionHeader({
  sessionId,
  status,
  startedAt,
  collectorName,
  isActive,
}: LiveCallSessionHeaderProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEndSession() {
    setError(null);

    startTransition(async () => {
      const result = await endLiveCallSession({ sessionId });

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
          {LIVE_CALL_SESSION_STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-white/70">Started {formatSessionDate(startedAt)}</span>
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {collectorName ?? "Live call coaching"}
        </h1>
        <p className="max-w-[42ch] text-sm leading-relaxed text-white/75">
          Enter what was said during your call. Mina provides educational communication
          guidance — not legal advice.
        </p>
      </div>
      {isActive ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleEndSession}
            disabled={isPending}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving summary…" : "End session & save summary"}
          </button>
          {error ? (
            <p className="rounded-xl border border-[#DC2626]/30 bg-[#7F1D1D]/40 px-4 py-3 text-sm text-white">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
