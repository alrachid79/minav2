"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { endLiveCallSession } from "@/app/actions/live-call";
import { LiveSessionTimer } from "@/components/live-call/whisper/LiveSessionTimer";
import { LIVE_CALL_SESSION_STATUS_LABELS } from "@/lib/live-call/constants";
import type { LiveCallSessionStatus } from "@/types/live-call";

interface WhisperModeSessionHeaderProps {
  sessionId: string;
  status: LiveCallSessionStatus;
  startedAt: string;
  collectorName: string | null;
  isActive: boolean;
}

export function WhisperModeSessionHeader({
  sessionId,
  status,
  startedAt,
  collectorName,
  isActive,
}: WhisperModeSessionHeaderProps) {
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#162033] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {isActive ? (
            <LiveSessionTimer startedAt={startedAt} isActive={isActive} />
          ) : (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Session status
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {LIVE_CALL_SESSION_STATUS_LABELS[status]}
              </p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4A017]">
              Mission control
            </p>
            <p className="mt-1 max-w-[14ch] truncate text-sm font-medium text-white/80">
              {collectorName ?? "Active call"}
            </p>
          </div>
        </div>
      </div>

      {isActive ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleEndSession}
            disabled={isPending}
            className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isPending ? "Saving…" : "End call & save summary"}
          </button>
          {error ? (
            <p className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 text-sm text-white">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
