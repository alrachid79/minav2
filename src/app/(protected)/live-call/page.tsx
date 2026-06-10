import Link from "next/link";

import { listLiveCallSessions } from "@/app/actions/live-call";
import { WhisperModeSessionList } from "@/components/live-call/WhisperModeSessionList";
import { WhisperModeStartButton } from "@/components/live-call/WhisperModeStartButton";
import {
  LIVE_CALL_EDUCATIONAL_DISCLAIMER,
  WHISPER_MODE_TAGLINE,
} from "@/lib/live-call/constants";

export default async function LiveCallPage() {
  const sessionsResult = await listLiveCallSessions();

  if ("error" in sessionsResult) {
    return (
      <div className="mx-auto w-full max-w-[480px] bg-[#0F172A] px-4 py-8 sm:px-6">
        <p className="rounded-xl border border-[#DC2626]/30 bg-[#7F1D1D]/40 px-4 py-3 text-sm text-white">
          {sessionsResult.error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0F172A]">
      <header className="border-b border-white/8 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[480px]">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017] transition hover:text-white"
          >
            ← Dashboard
          </Link>
          <div className="rounded-2xl border border-white/8 bg-[#162033] px-5 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4A017]">
              Financial Stress Recovery Coach
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Mina Whisper Mode
            </h1>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-white/60">
              {WHISPER_MODE_TAGLINE}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 space-y-6 px-4 py-8 sm:px-6">
        <WhisperModeStartButton />
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white/80">Recent sessions</h2>
          <WhisperModeSessionList sessions={sessionsResult} />
        </section>
        <p className="text-[10px] leading-relaxed text-white/35">{LIVE_CALL_EDUCATIONAL_DISCLAIMER}</p>
      </main>
    </div>
  );
}
