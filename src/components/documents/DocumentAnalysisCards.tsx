import { ResultCard } from "@/components/onboarding/ResultCard";
import { ENTITY_REVIEW_CONFIDENCE_THRESHOLD } from "@/lib/documents/intelligence/entity-confidence";
import type { DocumentAnalysisCards, DocumentExtractedField } from "@/types/documents";

interface DocumentAnalysisCardsProps {
  cards: DocumentAnalysisCards;
  extractedFields?: DocumentExtractedField[];
  legalAttentionRequired: boolean;
  documentTypeLabel?: string | null;
}

function displayFieldValue(
  fieldKey: string,
  value: string | null,
  extractedFields?: DocumentExtractedField[],
): string {
  if (!value) {
    return "Not found";
  }

  const confidence = extractedFields?.find((field) => field.field_key === fieldKey)
    ?.confidence_score;

  if (
    confidence !== null &&
    confidence !== undefined &&
    confidence < ENTITY_REVIEW_CONFIDENCE_THRESHOLD
  ) {
    return "Needs review";
  }

  return value;
}

function FieldRow({
  label,
  fieldKey,
  value,
  extractedFields,
}: {
  label: string;
  fieldKey: string;
  value: string | null;
  extractedFields?: DocumentExtractedField[];
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[#0F172A]/6 py-2 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        {label}
      </dt>
      <dd className="text-[15px] text-[#0F172A]">
        {displayFieldValue(fieldKey, value, extractedFields)}
      </dd>
    </div>
  );
}

export function DocumentAnalysisCardsView({
  cards,
  extractedFields,
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
          <FieldRow
            label="Sender"
            fieldKey="sender_name"
            value={cards.whoSentIt.senderName}
            extractedFields={extractedFields}
          />
          <FieldRow
            label="Collector"
            fieldKey="collector_name"
            value={cards.whoSentIt.collectorName}
            extractedFields={extractedFields}
          />
          <FieldRow
            label="Creditor"
            fieldKey="creditor_name"
            value={cards.whoSentIt.creditorName}
            extractedFields={extractedFields}
          />
          <FieldRow
            label="Account reference"
            fieldKey="account_reference"
            value={cards.whoSentIt.accountReference}
            extractedFields={extractedFields}
          />
          <FieldRow
            label="Phone"
            fieldKey="contact_phone"
            value={cards.whoSentIt.contactPhone}
            extractedFields={extractedFields}
          />
          <FieldRow
            label="Email"
            fieldKey="contact_email"
            value={cards.whoSentIt.contactEmail}
            extractedFields={extractedFields}
          />
          <FieldRow
            label="Address"
            fieldKey="contact_address"
            value={cards.whoSentIt.contactAddress}
            extractedFields={extractedFields}
          />
        </dl>
      </ResultCard>

      <ResultCard title="Important Dates" accent="gold">
        <dl>
          <FieldRow
            label="Document date"
            fieldKey="document_date"
            value={cards.importantDates.documentDate}
            extractedFields={extractedFields}
          />
          <FieldRow
            label="Response deadline"
            fieldKey="response_deadline"
            value={cards.importantDates.responseDeadline}
            extractedFields={extractedFields}
          />
          <FieldRow
            label="Court date"
            fieldKey="court_date"
            value={cards.importantDates.courtDate}
            extractedFields={extractedFields}
          />
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
