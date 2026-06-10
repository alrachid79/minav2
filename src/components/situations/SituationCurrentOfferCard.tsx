import type { SituationFinancialSignals } from "@/types/situations";

interface SituationCurrentOfferCardProps {
  signals: SituationFinancialSignals;
}

export function SituationCurrentOfferCard({ signals }: SituationCurrentOfferCardProps) {
  const hasOffer =
    signals.latestOffer || signals.deadline || signals.paymentTerms || signals.realityCheck;

  return (
    <section className="rounded-2xl border border-white/8 bg-[#162033] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4A017]">
        Current offer
      </p>

      {!hasOffer ? (
        <p className="mt-3 text-sm text-white/45">No offer captured yet for this situation.</p>
      ) : (
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between gap-3">
            <dt className="text-xs text-white/45">Settlement amount</dt>
            <dd className="font-mono text-sm font-semibold text-white">
              {signals.latestOffer ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-xs text-white/45">Deadline</dt>
            <dd className="text-sm text-white/80">{signals.deadline ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-xs text-white/45">Payment terms</dt>
            <dd className="text-sm text-white/80">{signals.paymentTerms ?? "—"}</dd>
          </div>
          {signals.realityCheck ? (
            <div className="mt-3 rounded-xl border border-[#F59E0B]/30 bg-[#0F172A] px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F59E0B]">
                Reality check
              </p>
              {signals.realityCheck.offer_amount || signals.realityCheck.monthly_amount ? (
                <p className="mt-1 font-mono text-xs text-white/60">
                  {signals.realityCheck.offer_amount
                    ? `Offer ${signals.realityCheck.offer_amount}`
                    : `Monthly ${signals.realityCheck.monthly_amount}`}
                  {signals.realityCheck.available_amount
                    ? ` · ${signals.realityCheck.available_label} ${signals.realityCheck.available_amount}`
                    : null}
                </p>
              ) : null}
              <p className="mt-1 text-sm font-semibold text-white/85">
                {signals.realityCheck.verdict}
              </p>
            </div>
          ) : null}
        </dl>
      )}
    </section>
  );
}
