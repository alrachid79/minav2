interface CapturedProgressProps {
  capturedLabels: string[];
  missingCount: number;
}

export function CapturedProgress({ capturedLabels, missingCount }: CapturedProgressProps) {
  const totalObjectives = capturedLabels.length + missingCount;
  const progressPercent =
    totalObjectives > 0 ? Math.round((capturedLabels.length / totalObjectives) * 100) : 0;

  return (
    <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
          Captured progress
        </p>
        <span className="font-mono text-xs font-semibold text-[#22C55E]">{progressPercent}%</span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[#22C55E] transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%`, boxShadow: "0 0 10px #22C55E66" }}
        />
      </div>

      {capturedLabels.length === 0 ? (
        <p className="text-sm text-white/40">Nothing captured yet — keep listening.</p>
      ) : (
        <ul className="space-y-2">
          {capturedLabels.map((label) => (
            <li key={label} className="flex items-center gap-2.5 text-sm text-white/90">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/15 text-xs text-[#22C55E]"
                aria-hidden
              >
                ✓
              </span>
              {label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
