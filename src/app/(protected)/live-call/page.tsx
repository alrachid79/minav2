import Link from "next/link";

import { listLiveCallSessions } from "@/app/actions/live-call";
import { LiveCallSessionList } from "@/components/live-call/LiveCallSessionList";
import { LiveCallStartButton } from "@/components/live-call/LiveCallStartButton";
import { LIVE_CALL_EDUCATIONAL_DISCLAIMER } from "@/lib/live-call/constants";

export default async function LiveCallPage() {
  const sessionsResult = await listLiveCallSessions();

  if ("error" in sessionsResult) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-4 py-8 sm:px-6">
        <p className="rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
          {sessionsResult.error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-[#0F172A] px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#14B8A6] transition hover:text-white"
            >
              ← Dashboard
            </Link>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#D4A017]">
              Live Call Assistant
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Call coaching
            </h1>
            <p className="max-w-[40ch] text-sm leading-relaxed text-white/75">
              Enter what was said during a collector call and get educational communication
              guidance from Mina.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[480px] flex-1 space-y-6 px-4 py-8 sm:px-6">
        <LiveCallStartButton />
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#0F172A]">Recent sessions</h2>
          <LiveCallSessionList sessions={sessionsResult} />
        </section>
        <p className="text-xs leading-relaxed text-[#64748B]">{LIVE_CALL_EDUCATIONAL_DISCLAIMER}</p>
      </main>
    </div>
  );
}
