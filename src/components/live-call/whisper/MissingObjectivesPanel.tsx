import { formatObjectiveLabel } from "@/components/live-call/whisper/whisper-ui-utils";

interface MissingObjectivesPanelProps {
  missing: string[];
}

export function MissingObjectivesPanel({ missing }: MissingObjectivesPanelProps) {
  if (missing.length === 0) {
    return (
      <section className="rounded-2xl border border-[#22C55E]/25 bg-[#22C55E]/8 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#22C55E]">
          Mission objectives
        </p>
        <p className="mt-2 text-sm text-white/75">All key objectives captured for this stage.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#F59E0B]/25 bg-[#162033] px-4 py-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F59E0B]">
        Missing — mission objectives
      </p>
      <ul className="space-y-2.5">
        {missing.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#F59E0B]/50 text-[10px] font-bold text-[#F59E0B]"
              aria-hidden
            >
              ○
            </span>
            <div>
              <p className="text-sm font-medium text-white/90">{formatObjectiveLabel(item)}</p>
              <p className="text-xs text-white/40">Request in writing before deciding</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
