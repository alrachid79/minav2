export function AnalysisLoadingView() {
  return (
    <div className="flex flex-col items-center gap-8 py-6 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span
          className="absolute inset-0 animate-pulse rounded-full bg-[#D4A017]/15"
          aria-hidden
        />
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A] text-lg font-bold text-[#D4A017]"
          aria-hidden
        >
          M
        </span>
      </div>
      <div className="space-y-3">
        <p className="text-lg font-semibold text-[#0F172A]">
          Mina is reviewing your situation
        </p>
        <p className="max-w-[28ch] text-base leading-relaxed text-[#6B7280]">
          Putting together a clear picture from what you shared — this usually
          takes a few seconds.
        </p>
      </div>
      <div className="flex items-center gap-2" aria-live="polite">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#D4A017] [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#D4A017] [animation-delay:200ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#D4A017] [animation-delay:400ms]" />
      </div>
    </div>
  );
}
