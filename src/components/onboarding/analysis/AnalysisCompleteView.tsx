export function AnalysisCompleteView() {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4A017]/15">
        <span className="text-2xl font-bold text-[#D4A017]" aria-hidden>
          ✓
        </span>
      </div>
      <div className="space-y-3">
        <p className="max-w-[32ch] text-base leading-relaxed text-[#6B7280]">
          Your onboarding analysis is saved on this device. When you&apos;re
          ready, Mina can help you take the next step — one calm action at a
          time.
        </p>
      </div>
      <div className="w-full rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/5 px-5 py-4 text-left">
        <p className="text-sm font-medium text-[#0F172A]">Coming soon</p>
        <p className="mt-1 text-sm text-[#6B7280]">
          Document Analysis, Letter Generator, Decision Shield, and Legal Support
          will connect here in a future release.
        </p>
      </div>
    </div>
  );
}
