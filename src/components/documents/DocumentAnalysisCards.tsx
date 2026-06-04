import { ResultCard } from "@/components/onboarding/ResultCard";
import type { DocumentAnalysisCards } from "@/types/documents";

interface DocumentAnalysisCardsProps {
  cards: DocumentAnalysisCards;
  legalAttentionRequired: boolean;
  documentTypeLabel?: string | null;
}

function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[#0F172A]/6 py-2 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        {label}
      </dt>
      <dd className="text-[15px] text-[#0F172A]">{value ?? "Not found"}</dd>
    </div>
  );
}

export function DocumentAnalysisCardsView({
  cards,
  legalAttentionRequired,
  documentTypeLabel,
}: DocumentAnalysisCardsProps) {
  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] px-4 py-3 text-xs leading-relaxed text-[#6B7280]">
        This is guidance to help you understand your document — not legal
        advice. Mina does not validate debts, interpret law, or predict outcomes.
      </p>

      {legalAttentionRequired ? (
        <div className="rounded-xl border border-[#F59E0B]/35 bg-[#FFFBEB] px-4 py-4">
          <p className="text-sm font-semibold text-[#92400E]">
            Legal attention may be needed
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#92400E]/90">
            This document contains language that may relate to legal action,
            court dates, or enforcement. Review carefully and consider speaking
            with a qualified professional in your state.
          </p>
        </div>
      ) : null}

      {documentTypeLabel ? (
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017]">
          {documentTypeLabel}
        </p>
      ) : null}

      <ResultCard title="Document Summary" accent="navy">
        <p>{cards.documentSummary}</p>
      </ResultCard>

      <ResultCard title="Who Sent It" accent="teal">
        <dl>
          <FieldRow label="Sender" value={cards.whoSentIt.senderName} />
          <FieldRow label="Collector" value={cards.whoSentIt.collectorName} />
          <FieldRow label="Creditor" value={cards.whoSentIt.creditorName} />
          <FieldRow label="Phone" value={cards.whoSentIt.contactPhone} />
          <FieldRow label="Email" value={cards.whoSentIt.contactEmail} />
          <FieldRow label="Address" value={cards.whoSentIt.contactAddress} />
        </dl>
      </ResultCard>

      <ResultCard title="Important Dates" accent="gold">
        <dl>
          <FieldRow label="Document date" value={cards.importantDates.documentDate} />
          <FieldRow
            label="Response deadline"
            value={cards.importantDates.responseDeadline}
          />
          <FieldRow label="Court date" value={cards.importantDates.courtDate} />
        </dl>
      </ResultCard>

      <ResultCard title="What Mina Noticed" accent="teal">
        <ul className="list-disc space-y-2 pl-5">
          {cards.whatMinaNoticed.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ResultCard>

      <ResultCard title="Recommended Next Step" accent="navy">
        <p className="font-medium text-[#0F172A]">
          {cards.recommendedNextStep.title}
        </p>
        <p className="mt-2">{cards.recommendedNextStep.description}</p>
        {cards.supportingActions.length > 0 ? (
          <div className="mt-4 space-y-3 border-t border-[#0F172A]/8 pt-4">
            {cards.supportingActions.map((action) => (
              <div key={action.title}>
                <p className="text-sm font-medium text-[#0F172A]">
                  {action.title}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">{action.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </ResultCard>
    </div>
  );
}
