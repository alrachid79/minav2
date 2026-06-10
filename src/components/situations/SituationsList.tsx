import Link from "next/link";

import { SituationCard } from "@/components/situations/SituationCard";
import { MINA_GETTING_STARTED_COPY } from "@/lib/ui/empty-state-copy";
import type { SituationsListSnapshot } from "@/types/situations";

interface SituationsListProps {
  snapshot: SituationsListSnapshot;
}

export function SituationsList({ snapshot }: SituationsListProps) {
  if (snapshot.situations.length === 0) {
    return (
      <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-8 text-center">
        <p className="text-sm font-semibold text-white">Your situations will appear here</p>
        <p className="mt-2 text-sm leading-relaxed text-white/50">{MINA_GETTING_STARTED_COPY}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/live-call"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0F172A] transition hover:bg-[#E4B429]"
          >
            Start Whisper Mode
          </Link>
          <Link
            href="/documents"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            Review a letter
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {snapshot.situations.map((situation) => (
        <SituationCard key={situation.id} situation={situation} />
      ))}
    </div>
  );
}
