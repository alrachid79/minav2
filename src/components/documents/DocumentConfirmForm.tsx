"use client";

import { useState, useTransition } from "react";

import { confirmDocument } from "@/app/actions/confirm-document";
import { ConfirmFieldEditor } from "@/components/documents/ConfirmFieldEditor";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documents/intelligence/classify";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/documents/intelligence/types";
import { buildInitialConfirmValues } from "@/lib/documents/confirm/build-initial-values";
import type { DocumentConfirmFormValues } from "@/types/document-confirm";
import type { DocumentProcessingSnapshot } from "@/types/documents";

interface DocumentConfirmFormProps {
  snapshot: DocumentProcessingSnapshot;
  onConfirmed: () => void;
  onBack: () => void;
}

export function DocumentConfirmForm({
  snapshot,
  onConfirmed,
  onBack,
}: DocumentConfirmFormProps) {
  const [form, setForm] = useState<DocumentConfirmFormValues>(() =>
    buildInitialConfirmValues(snapshot),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof Omit<DocumentConfirmFormValues, "documentType">>(
    key: K,
    patch: Partial<DocumentConfirmFormValues[K]>,
  ) {
    setForm((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...patch,
      },
    }));
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const result = await confirmDocument({
        documentId: snapshot.document.id,
        documentType: form.documentType,
        collectorName: form.collectorName,
        creditorName: form.creditorName,
        balanceAmount: form.balanceAmount,
        documentDate: form.documentDate,
        responseDeadline: form.responseDeadline,
        courtDate: form.courtDate,
      });

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      onConfirmed();
    });
  }

  const summary =
    snapshot.latestRun?.plain_language_summary ??
    snapshot.cards?.documentSummary ??
    "No summary available.";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017]">
          Confirm details
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[#0F172A]">
          Review before confirming
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
          Check what Mina found. Edit anything that looks wrong or mark fields
          as unknown. Nothing updates your broader Mina profile until you
          confirm.
        </p>
      </div>

      <p className="rounded-xl border border-[#0F172A]/8 bg-[#F8FAFC] px-4 py-3 text-xs leading-relaxed text-[#6B7280]">
        This is guidance to help you understand your document — not legal
        advice. Amounts and dates reflect what the document appears to state.
      </p>

      <section className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0F172A]">Document Summary</h3>
        <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">{summary}</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0F172A]">Document Type</h3>
        <select
          value={form.documentType}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              documentType: event.target.value as DocumentType,
            }))
          }
          className="min-h-[44px] w-full rounded-lg border border-[#0F172A]/12 bg-white px-3 py-2 text-sm text-[#0F172A]"
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {DOCUMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-4 rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0F172A]">Entities</h3>
        <ConfirmFieldEditor
          label="Collector"
          value={form.collectorName.value}
          unknown={form.collectorName.unknown}
          onValueChange={(value) => updateField("collectorName", { value })}
          onUnknownChange={(unknown) =>
            updateField("collectorName", { unknown, value: unknown ? "" : form.collectorName.value })
          }
        />
        <ConfirmFieldEditor
          label="Creditor"
          value={form.creditorName.value}
          unknown={form.creditorName.unknown}
          onValueChange={(value) => updateField("creditorName", { value })}
          onUnknownChange={(unknown) =>
            updateField("creditorName", { unknown, value: unknown ? "" : form.creditorName.value })
          }
        />
        <ConfirmFieldEditor
          label="Balance (as stated on document)"
          value={form.balanceAmount.value}
          unknown={form.balanceAmount.unknown}
          hint="Mina does not validate that this amount is correct or owed."
          onValueChange={(value) => updateField("balanceAmount", { value })}
          onUnknownChange={(unknown) =>
            updateField("balanceAmount", { unknown, value: unknown ? "" : form.balanceAmount.value })
          }
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0F172A]">Important Dates</h3>
        <ConfirmFieldEditor
          label="Document date"
          value={form.documentDate.value}
          unknown={form.documentDate.unknown}
          onValueChange={(value) => updateField("documentDate", { value })}
          onUnknownChange={(unknown) =>
            updateField("documentDate", { unknown, value: unknown ? "" : form.documentDate.value })
          }
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0F172A]">Deadlines</h3>
        <ConfirmFieldEditor
          label="Response deadline"
          value={form.responseDeadline.value}
          unknown={form.responseDeadline.unknown}
          onValueChange={(value) => updateField("responseDeadline", { value })}
          onUnknownChange={(unknown) =>
            updateField("responseDeadline", {
              unknown,
              value: unknown ? "" : form.responseDeadline.value,
            })
          }
        />
        <ConfirmFieldEditor
          label="Court date"
          value={form.courtDate.value}
          unknown={form.courtDate.unknown}
          onValueChange={(value) => updateField("courtDate", { value })}
          onUnknownChange={(unknown) =>
            updateField("courtDate", { unknown, value: unknown ? "" : form.courtDate.value })
          }
        />
      </section>

      <section className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0F172A]">Legal Attention</h3>
        <p className="mt-3 text-sm text-[#6B7280]">
          {snapshot.legalAttentionRequired
            ? "Mina detected language that may relate to legal action or enforcement. Review carefully — this is not legal advice."
            : "No legal attention indicators were detected in this document."}
        </p>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Status:{" "}
          <span className="text-[#0F172A]">
            {snapshot.legalAttentionRequired ? "Flagged for review" : "Not flagged"}
          </span>
        </p>
      </section>

      {error ? (
        <p className="rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="min-h-[48px] rounded-lg bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-60"
        >
          {isPending ? "Confirming…" : "Confirm document"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="min-h-[48px] rounded-lg border border-[#0F172A]/15 bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC]"
        >
          Back to analysis
        </button>
      </div>
    </div>
  );
}
