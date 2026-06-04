import type { LiveCallSummaryRecord } from "@/types/live-call";

interface LiveCallSummaryPanelProps {
  summary: LiveCallSummaryRecord;
}

function renderList(items: string[] | null, emptyLabel: string) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-[#64748B]">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="text-sm leading-relaxed text-[#334155] before:mr-2 before:text-[#14B8A6] before:content-['•']"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LiveCallSummaryPanel({ summary }: LiveCallSummaryPanelProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#D4A017]/30 bg-[#FFFBEB] px-4 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B45309]">
          Session summary
        </p>
        <p className="mt-1 text-sm text-[#92400E]">
          Saved for your review. This is educational — not legal advice.
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#92400E]">
          What happened
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0F172A]">
          {summary.what_happened}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#92400E]">
          Important points
        </p>
        {renderList(summary.important_points, "No key points recorded.")}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#92400E]">Risks noted</p>
        {renderList(summary.risks, "No specific risks flagged.")}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#92400E]">
          Communication reminders
        </p>
        {renderList(summary.recommended_actions, "No reminders recorded.")}
      </div>

      {summary.next_step ? (
        <div className="space-y-1 rounded-xl bg-white/70 px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#92400E]">
            Suggested next step
          </p>
          <p className="text-sm leading-relaxed text-[#0F172A]">{summary.next_step}</p>
        </div>
      ) : null}
    </section>
  );
}
