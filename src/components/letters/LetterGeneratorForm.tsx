"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { generateLetter } from "@/app/actions/generate-letter";
import { LetterTypeSelector } from "@/components/letters/LetterTypeSelector";
import {
  LETTER_EDUCATIONAL_DISCLAIMER,
  LETTER_TYPE_DESCRIPTIONS,
} from "@/lib/letters/constants";
import { LETTER_TYPES, type LetterGeneratorContext, type LetterType } from "@/types/letters";

interface LetterGeneratorFormProps {
  context: LetterGeneratorContext;
}

export function LetterGeneratorForm({ context }: LetterGeneratorFormProps) {
  const router = useRouter();
  const [letterType, setLetterType] = useState<LetterType>("validation");
  const [documentId, setDocumentId] = useState("");
  const [collectorId, setCollectorId] = useState("");
  const [debtSituationId, setDebtSituationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeTemplateNames = useMemo(() => {
    const names = new Map<LetterType, string>();

    for (const template of context.templates) {
      if (LETTER_TYPES.includes(template.letter_type)) {
        names.set(template.letter_type, template.name);
      }
    }

    return names;
  }, [context.templates]);

  function handleDocumentChange(nextDocumentId: string) {
    setDocumentId(nextDocumentId);

    if (!nextDocumentId) {
      return;
    }

    const document = context.documents.find((item) => item.id === nextDocumentId);

    if (!document) {
      return;
    }

    if (document.collectorId) {
      setCollectorId(document.collectorId);
    }

    if (document.debtSituationId) {
      setDebtSituationId(document.debtSituationId);
    }
  }

  function handleGenerate() {
    setError(null);

    startTransition(async () => {
      const result = await generateLetter({
        letterType,
        documentId: documentId || undefined,
        collectorId: collectorId || undefined,
        debtSituationId: debtSituationId || undefined,
      });

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      router.push(`/letters/${result.letterId}`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017]">
          Step 1
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[#0F172A]">
          Choose a letter type
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
          Mina drafts educational letter text using your profile and any linked
          account details. Review everything carefully before sending.
        </p>

        <div className="mt-6">
          <LetterTypeSelector
            value={letterType}
            onChange={setLetterType}
            templateNames={activeTemplateNames}
          />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#6B7280]">
          {LETTER_TYPE_DESCRIPTIONS[letterType]}
        </p>
      </div>

      <div className="rounded-2xl border border-[#0F172A]/10 bg-white px-6 py-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D4A017]">
          Step 2
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[#0F172A]">
          Link context (optional)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
          Linking a confirmed document, collector, or debt situation helps Mina
          include relevant account details in the draft.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#0F172A]">
              Confirmed document
            </span>
            <select
              value={documentId}
              onChange={(event) => handleDocumentChange(event.target.value)}
              className="w-full rounded-xl border border-[#0F172A]/15 bg-white px-4 py-3 text-sm text-[#111827] outline-none ring-[#14B8A6] focus:ring-2"
            >
              <option value="">No document linked</option>
              {context.documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#0F172A]">Collector</span>
            <select
              value={collectorId}
              onChange={(event) => setCollectorId(event.target.value)}
              className="w-full rounded-xl border border-[#0F172A]/15 bg-white px-4 py-3 text-sm text-[#111827] outline-none ring-[#14B8A6] focus:ring-2"
            >
              <option value="">No collector linked</option>
              {context.collectors.map((collector) => (
                <option key={collector.id} value={collector.id}>
                  {collector.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#0F172A]">
              Debt situation
            </span>
            <select
              value={debtSituationId}
              onChange={(event) => setDebtSituationId(event.target.value)}
              className="w-full rounded-xl border border-[#0F172A]/15 bg-white px-4 py-3 text-sm text-[#111827] outline-none ring-[#14B8A6] focus:ring-2"
            >
              <option value="">No debt situation linked</option>
              {context.debtSituations.map((situation) => (
                <option key={situation.id} value={situation.id}>
                  {situation.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-6 py-5">
        <p className="text-sm leading-relaxed text-[#92400E]">
          {LETTER_EDUCATIONAL_DISCLAIMER}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="w-full rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Generating draft..." : "Generate letter draft"}
      </button>
    </div>
  );
}
