import type { WhisperRealityCheckPayload } from "@/types/live-call";

interface RealityCheckCardProps {
  realityCheck: WhisperRealityCheckPayload;
}

export function RealityCheckCard({ realityCheck }: RealityCheckCardProps) {
  const isPressure =
    realityCheck.classification === "may_create_financial_pressure" ||
    realityCheck.verdict.toLowerCase().includes("too high") ||
    realityCheck.verdict.toLowerCase().includes("financial pressure");

  return (
    <section className="rounded-2xl border border-[#F59E0B]/30 bg-[#162033] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F59E0B]">
        Reality check
      </p>
      <dl className="mt-3 space-y-2">
        {realityCheck.offer_amount ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-white/45">Offer</dt>
            <dd className="font-mono text-sm font-semibold text-white">
              {realityCheck.offer_amount}
            </dd>
          </div>
        ) : null}
        {realityCheck.monthly_amount ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-white/45">Monthly</dt>
            <dd className="font-mono text-sm font-semibold text-white">
              {realityCheck.monthly_amount}
            </dd>
          </div>
        ) : null}
        {realityCheck.available_amount && realityCheck.available_label ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-white/45">{realityCheck.available_label}</dt>
            <dd className="font-mono text-sm font-semibold text-white">
              {realityCheck.available_amount}
            </dd>
          </div>
        ) : null}
      </dl>
      <p
        className={`mt-3 flex items-center gap-2 text-sm font-semibold ${
          isPressure ? "text-[#EF4444]" : "text-[#F59E0B]"
        }`}
      >
        <span aria-hidden>{isPressure ? "⚠" : "◆"}</span>
        {realityCheck.verdict}
      </p>
    </section>
  );
}
