"use client";

import { useState, useTransition } from "react";

import { integrateConfirmedDocument } from "@/app/actions/integrate-document";

interface DocumentIntegrationPromptProps {
  documentId: string;
  onIntegrated: () => void;
  onUploadAnother?: () => void;
}

export function DocumentIntegrationPrompt({
  documentId,
  onIntegrated,
  onUploadAnother,
}: DocumentIntegrationPromptProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleIntegrate() {
    setError(null);

    startTransition(async () => {
      const result = await integrateConfirmedDocument({ documentId });

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      onIntegrated();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/5 px-6 py-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#14B8A6]/15">
          <span className="text-lg font-bold text-[#14B8A6]" aria-hidden>
            ✓
          </span>
        </div>
        <h2 className="text-lg font-semibold text-[#0F172A]">
          Document confirmed and ready for integration.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
          Your confirmed details are saved. Run integration to prepare this
          document for Mina intelligence updates.
        </p>
        <button
          type="button"
          onClick={handleIntegrate}
          disabled={isPending}
          className="mt-6 min-h-[48px] rounded-lg bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-60"
        >
          {isPending ? "Integrating…" : "Integrate with Mina"}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
          {error}
        </p>
      ) : null}

      {onUploadAnother ? (
        <button
          type="button"
          onClick={onUploadAnother}
          className="min-h-[44px] rounded-lg border border-[#0F172A]/15 bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC]"
        >
          Upload another document
        </button>
      ) : null}
    </div>
  );
}
