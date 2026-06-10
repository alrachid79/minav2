import type { LiveCallSummaryRecord } from "@/types/live-call";

interface WhisperModeSummaryPanelProps {
  summary: LiveCallSummaryRecord;
}

function renderList(items: string[] | null, emptyLabel: string) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-white/40">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="text-sm leading-relaxed text-white/75 before:mr-2 before:text-[#22C55E] before:content-['•']"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function WhisperModeSummaryPanel({ summary }: WhisperModeSummaryPanelProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#D4A017]/25 bg-[#162033] px-4 py-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4A017]">
          After-call debrief
        </p>
        <p className="mt-1 text-xs text-white/40">Full details — not shown during live mode.</p>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
          What happened
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
          {summary.what_happened}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
          Captured across the call
        </p>
        {renderList(summary.important_points, "No details captured.")}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
          Pressure noted
        </p>
        {renderList(summary.risks, "No pressure flags.")}
      </div>

      {summary.next_step ? (
        <div className="rounded-xl border border-white/8 bg-[#0F172A] px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#22C55E]">
            Next step
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/80">{summary.next_step}</p>
        </div>
      ) : null}
    </section>
  );
}
