import Link from "next/link";

import { WhisperModeInputForm } from "@/components/live-call/WhisperModeInputForm";
import { WhisperModeMessageList } from "@/components/live-call/WhisperModeMessageList";
import { WhisperModeSessionHeader } from "@/components/live-call/WhisperModeSessionHeader";
import { WhisperModeSummaryPanel } from "@/components/live-call/WhisperModeSummaryPanel";
import { LIVE_CALL_EDUCATIONAL_DISCLAIMER } from "@/lib/live-call/constants";
import type { LiveCallSessionSnapshot } from "@/types/live-call";

interface WhisperModeConversationProps {
  snapshot: LiveCallSessionSnapshot;
}

export function WhisperModeConversation({ snapshot }: WhisperModeConversationProps) {
  const isActive =
    snapshot.session.status === "active" || snapshot.session.status === "paused";
  const debtSituationId = snapshot.session.debt_situation_id;

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col bg-[#0F172A]">
      <header className="shrink-0 border-b border-white/8 px-4 py-4 sm:px-6">
        <div className="mx-auto w-full max-w-[480px]">
          <Link
            href="/live-call"
            className="mb-4 inline-flex text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017] transition hover:text-white"
          >
            ← Exit mission control
          </Link>
          <WhisperModeSessionHeader
            sessionId={snapshot.session.id}
            status={snapshot.session.status}
            startedAt={snapshot.session.started_at}
            collectorName={snapshot.collectorName}
            isActive={isActive}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 sm:px-6">
        <div className="flex-1 space-y-3 overflow-y-auto py-4 pb-2">
          <WhisperModeMessageList messages={snapshot.messages} isActive={isActive} />

          {!isActive && snapshot.summary ? (
            <WhisperModeSummaryPanel summary={snapshot.summary} />
          ) : null}

          {!isActive ? (
            <div className="space-y-3">
              <p className="rounded-xl border border-white/8 bg-[#162033] px-4 py-3 text-sm text-white/55">
                Session complete. Review the summary or start a new Whisper Mode session.
              </p>
              {debtSituationId ? (
                <Link
                  href={`/situations/${debtSituationId}`}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#D4A017] px-4 py-3 text-sm font-bold text-[#0F172A] transition hover:bg-[#E4B429]"
                >
                  View My Situation
                </Link>
              ) : null}
            </div>
          ) : null}

          <p className="pb-1 text-[9px] leading-relaxed text-white/30">
            {LIVE_CALL_EDUCATIONAL_DISCLAIMER}
          </p>
        </div>

        {isActive ? <WhisperModeInputForm sessionId={snapshot.session.id} /> : null}
      </main>
    </div>
  );
}
