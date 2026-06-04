import Link from "next/link";

import { LiveCallInputForm } from "@/components/live-call/LiveCallInputForm";
import { LiveCallMessageList } from "@/components/live-call/LiveCallMessageList";
import { LiveCallSessionHeader } from "@/components/live-call/LiveCallSessionHeader";
import { LiveCallSummaryPanel } from "@/components/live-call/LiveCallSummaryPanel";
import { LIVE_CALL_EDUCATIONAL_DISCLAIMER } from "@/lib/live-call/constants";
import type { LiveCallSessionSnapshot } from "@/types/live-call";

interface LiveCallConversationProps {
  snapshot: LiveCallSessionSnapshot;
}

export function LiveCallConversation({ snapshot }: LiveCallConversationProps) {
  const isActive =
    snapshot.session.status === "active" || snapshot.session.status === "paused";

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-[#0F172A] px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-4">
            <Link
              href="/live-call"
              className="text-sm font-medium text-[#14B8A6] transition hover:text-white"
            >
              ← Call sessions
            </Link>
          </div>
          <LiveCallSessionHeader
            sessionId={snapshot.session.id}
            status={snapshot.session.status}
            startedAt={snapshot.session.started_at}
            collectorName={snapshot.collectorName}
            isActive={isActive}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 space-y-6 px-4 py-8 sm:px-6">
        <LiveCallMessageList messages={snapshot.messages} />

        {snapshot.summary ? <LiveCallSummaryPanel summary={snapshot.summary} /> : null}

        {isActive ? (
          <LiveCallInputForm sessionId={snapshot.session.id} />
        ) : (
          <p className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4 text-sm text-[#64748B]">
            This session is complete. You can review the conversation above or start a new
            session from the list.
          </p>
        )}

        <p className="text-xs leading-relaxed text-[#64748B]">{LIVE_CALL_EDUCATIONAL_DISCLAIMER}</p>
      </main>
    </div>
  );
}
